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