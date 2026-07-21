import { NextResponse } from 'next/server';

interface IndexQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

const INDICES: { symbol: string; name: string }[] = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW JONES' },
];

export async function GET() {
  try {
    const results = await Promise.all(
      INDICES.map(async ({ symbol, name }): Promise<IndexQuote> => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
          const response = await fetch(url);

          if (!response.ok) {
            return { symbol, name, price: null, change: null, changePercent: null };
          }

          const data = await response.json();
          const meta = data?.chart?.result?.[0]?.meta;

          if (!meta) {
            return { symbol, name, price: null, change: null, changePercent: null };
          }

          const price = meta.regularMarketPrice ?? null;
          const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;

          let change: number | null = null;
          let changePercent: number | null = null;

          if (price !== null && prevClose !== null && prevClose !== 0) {
            change = price - prevClose;
            changePercent = (change / prevClose) * 100;
          }

          return { symbol, name, price, change, changePercent };
        } catch (err) {
          console.error(`Error fetching index ${symbol}:`, err);
          return { symbol, name, price: null, change: null, changePercent: null };
        }
      })
    );

    return NextResponse.json({ data: results });
  } catch (e: any) {
    console.error('Error fetching market indices:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch indices' }, { status: 500 });
  }
}