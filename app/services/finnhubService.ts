import { db, schema } from '../lib/db';
import { eq, and } from 'drizzle-orm';

const { systemApiKeys } = schema;

export interface FinnhubNewsItem {
  category: string;
  datetime: number;      // unix seconds
  headline: string;
  id: number;
  image: string;
  related: string;       // ticker
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // day high
  l: number;  // day low
  o: number;  // open
  pc: number; // previous close
}

export interface TickerMarketData {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  week52High: number | null;
  week52Low: number | null;
  peForward: number | null;
}

export async function getFinnhubApiKey(): Promise<string> {
  const data = await db
    .select()
    .from(systemApiKeys)
    .where(
      and(
        eq(systemApiKeys.service_code, 'FINNHUB'),
        eq(systemApiKeys.environment, 'PRODUCTION')
      )
    )
    .limit(1);

  if (!data || data.length === 0 || !data[0].api_key) {
    throw new Error('Finnhub API key not found');
  }

  return data[0].api_key;
}

/**
 * Fetch recent company news for a single ticker from Finnhub.
 * Finnhub's company-news endpoint is one symbol per call.
 */
export async function getCompanyNews(
  ticker: string,
  apiKey: string,
  fromDate: string,
  toDate: string
): Promise<FinnhubNewsItem[]> {
  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${fromDate}&to=${toDate}&token=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub request failed for ${ticker}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Tag each item with the ticker we queried (related field can be noisy)
    return data.map((item: FinnhubNewsItem) => ({ ...item, related: ticker }));
  } catch (error) {
    console.error(`Error fetching Finnhub news for ${ticker}:`, error);
    return [];
  }
}

/**
 * Current quote for a single ticker.
 */
export async function getQuote(ticker: string, apiKey: string): Promise<FinnhubQuote | null> {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub quote failed for ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (typeof data?.c !== 'number') return null;

    return data as FinnhubQuote;
  } catch (error) {
    console.error(`Error fetching Finnhub quote for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fundamentals for a single ticker (52w high/low, forward P/E, etc).
 */
export async function getMetrics(
  ticker: string,
  apiKey: string
): Promise<{ week52High: number | null; week52Low: number | null; peForward: number | null }> {
  try {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub metrics failed for ${ticker}: ${response.status}`);
      return { week52High: null, week52Low: null, peForward: null };
    }

    const data = await response.json();
    const m = data?.metric ?? {};

    return {
      week52High: typeof m['52WeekHigh'] === 'number' ? m['52WeekHigh'] : null,
      week52Low: typeof m['52WeekLow'] === 'number' ? m['52WeekLow'] : null,
      peForward:
        typeof m['forwardPE'] === 'number'
          ? m['forwardPE']
          : typeof m['peBasicExclExtraTTM'] === 'number'
            ? m['peBasicExclExtraTTM']
            : null,
    };
  } catch (error) {
    console.error(`Error fetching Finnhub metrics for ${ticker}:`, error);
    return { week52High: null, week52Low: null, peForward: null };
  }
}