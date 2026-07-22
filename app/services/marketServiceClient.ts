export interface IndexQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

export interface PositionNewsItem {
  id: number;
  ticker: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // unix seconds
}

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

export async function getTradeMetrics(tickers: string[]): Promise<Record<string, TickerMarketData>> {
  if (tickers.length === 0) return {};

  const response = await fetch('/api/market/trade-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trade metrics');
  }

  const result = await response.json();
  return result.data;
}

export async function getIndices(): Promise<IndexQuote[]> {
  const response = await fetch('/api/market/indices');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch market indices');
  }

  const result = await response.json();
  return result.data;
}

export async function getPositionNews(): Promise<{ data: PositionNewsItem[]; tickers: string[] }> {
  const response = await fetch('/api/market/position-news');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch position news');
  }

  const result = await response.json();
  return { data: result.data, tickers: result.tickers };
}