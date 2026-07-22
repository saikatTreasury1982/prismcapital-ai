import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { getFinnhubApiKey, getQuote, getMetrics } from '@/app/services/finnhubService';

export interface TickerMarketData {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  week52High: number | null;
  week52Low: number | null;
  peForward: number | null;
  sparkline: number[];
}

// Run promises in bounded batches to respect rate limits
async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
  }
  return out;
}

/**
 * Daily closes for the last ~30 days, from Yahoo (keyless).
 */
async function getSparkline(ticker: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1mo`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const data = await response.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;

    if (!Array.isArray(closes)) return [];

    // Drop nulls (market holidays etc.)
    return closes.filter((c: number | null): c is number => typeof c === 'number');
  } catch (error) {
    console.error(`Error fetching sparkline for ${ticker}:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const tickers: string[] = Array.isArray(body?.tickers) ? body.tickers : [];

    if (tickers.length === 0) {
      return NextResponse.json({ data: {} });
    }

    const uniqueTickers = Array.from(new Set(tickers.filter(Boolean)));

    // Finnhub key fetched once (global/system key)
    let apiKey: string | null = null;
    try {
      apiKey = await getFinnhubApiKey();
    } catch (err) {
      console.error('Finnhub key unavailable:', err);
      // Continue anyway — sparklines from Yahoo will still work
    }

    const results = await inBatches(uniqueTickers, 5, async (ticker): Promise<TickerMarketData> => {
      const [quote, metrics, sparkline] = await Promise.all([
        apiKey ? getQuote(ticker, apiKey) : Promise.resolve(null),
        apiKey
          ? getMetrics(ticker, apiKey)
          : Promise.resolve({ week52High: null, week52Low: null, peForward: null }),
        getSparkline(ticker),
      ]);

      return {
        ticker,
        price: quote?.c ?? null,
        change: quote?.d ?? null,
        changePercent: quote?.dp ?? null,
        week52High: metrics.week52High,
        week52Low: metrics.week52Low,
        peForward: metrics.peForward,
        sparkline,
      };
    });

    // Return as a map keyed by ticker for easy lookup on the client
    const map: Record<string, TickerMarketData> = {};
    for (const item of results) {
      map[item.ticker] = item;
    }

    return NextResponse.json({ data: map });
  } catch (e: any) {
    console.error('Error fetching trade metrics:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch trade metrics' }, { status: 500 });
  }
}