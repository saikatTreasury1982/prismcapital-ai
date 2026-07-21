import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';
import { getFinnhubApiKey, getCompanyNews, FinnhubNewsItem } from '@/app/services/finnhubService';

const { positions } = schema;

// Format a Date as YYYY-MM-DD for Finnhub's from/to params
function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Run promises in bounded batches to respect Finnhub's rate limit
async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
  }
  return out;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get the user's active-position tickers
    const rows = await db
      .select({ ticker: positions.ticker })
      .from(positions)
      .where(
        and(
          eq(positions.user_id, session.user.id),
          eq(positions.is_active, 1)
        )
      );

    const tickers = Array.from(new Set(rows.map(r => r.ticker))).filter(Boolean);

    if (tickers.length === 0) {
      return NextResponse.json({ data: [], tickers: [] });
    }

    // 2. Fetch the Finnhub key once (global/system key)
    const apiKey = await getFinnhubApiKey();

    // 3. Date range: last 7 days
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fromStr = fmt(from);
    const toStr = fmt(to);

    // 4. Loop tickers in bounded batches (5 at a time)
    const perTicker = await inBatches(tickers, 5, (ticker) =>
      getCompanyNews(ticker, apiKey, fromStr, toStr)
    );

    // 5. Merge, sort newest-first, dedupe by url+headline, cap at 15
    const merged: FinnhubNewsItem[] = perTicker.flat();

    const seen = new Set<string>();
    const deduped = merged.filter(item => {
      const key = `${item.url}::${item.headline}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => b.datetime - a.datetime);

    const top = deduped.slice(0, 15).map(item => ({
      id: item.id,
      ticker: item.related,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image,
      datetime: item.datetime,
    }));

    return NextResponse.json({ data: top, tickers });
  } catch (e: any) {
    console.error('Error fetching position news:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch position news' }, { status: 500 });
  }
}