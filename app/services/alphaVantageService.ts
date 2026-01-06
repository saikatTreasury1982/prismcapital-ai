
import { db, schema } from '../lib/db';
import { eq, and } from 'drizzle-orm';

const { systemApiKeys } = schema;

interface AlphaVantageSearchResult {
  bestMatches?: Array<{
    '1. symbol': string;
    '2. name': string;
    '3. type': string;
    '4. region': string;
    '5. marketOpen': string;
    '6. marketClose': string;
    '7. timezone': string;
    '8. currency': string;
    '9. matchScore': string;
  }>;
  Note?: string;
  Information?: string;
}

export async function getAlphaVantageApiKey(): Promise<string> {
  const data = await db
    .select()
    .from(systemApiKeys)
    .where(
      and(
        eq(systemApiKeys.service_code, 'ALPHAVANTAGE'),
        eq(systemApiKeys.environment, 'PRODUCTION')
      )
    )
    .limit(1);

  if (!data || data.length === 0 || !data[0].api_key) {
    throw new Error('AlphaVantage API key not found');
  }
  
  return data[0].api_key;
}

export async function searchTicker(ticker: string): Promise<{ name: string | null; error: string | null }> {
  try {
    const apiKey = await getAlphaVantageApiKey();
    
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('AlphaVantage API request failed');
    }
    
    const data: AlphaVantageSearchResult = await response.json();
    
    // Check for API limit or error messages
    if (data.Note) {
      return { name: null, error: 'API rate limit reached. Please try again later.' };
    }
    
    if (data.Information) {
      return { name: null, error: 'API error. Please try again.' };
    }
    
    // Check if we have matches
    if (!data.bestMatches || data.bestMatches.length === 0) {
      return { name: null, error: 'Ticker not found. Please check the symbol.' };
    }
    
    // Find exact match (case insensitive)
    const exactMatch = data.bestMatches.find(
      match => match['1. symbol'].toUpperCase() === ticker.toUpperCase()
    );
    
    if (exactMatch) {
      return { name: exactMatch['2. name'], error: null };
    }
    
    // If no exact match, use best match (highest score)
    const bestMatch = data.bestMatches[0];
    return { name: bestMatch['2. name'], error: null };
    
  } catch (error: any) {
    console.error('AlphaVantage search error:', error);
    return { name: null, error: error.message || 'Failed to lookup ticker' };
  }
}