import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';

const { systemApiKeys } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  try {
    // Get AlphaVantage API key from database
    const apiKeyData = await db
      .select()
      .from(systemApiKeys)
      .where(
        and(
          eq(systemApiKeys.service_code, 'ALPHAVANTAGE'),
          eq(systemApiKeys.environment, 'PRODUCTION')
        )
      )
      .limit(1);

    if (!apiKeyData || apiKeyData.length === 0 || !apiKeyData[0].api_key) {
      throw new Error('Failed to fetch AlphaVantage API key');
    }

    const apiKey = apiKeyData[0].api_key;

    // Call AlphaVantage OVERVIEW endpoint
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('AlphaVantage API request failed');
    }

    const data = await response.json();

    if (data.Note || data.Information || data['Error Message']) {
      return NextResponse.json({ 
        error: data.Note || data.Information || data['Error Message'] || 'API error'
      }, { status: 400 });
    }

    // Get current price from GLOBAL_QUOTE
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    let currentPrice = null;

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      if (quoteData['Global Quote'] && quoteData['Global Quote']['05. price']) {
        currentPrice = quoteData['Global Quote']['05. price'];
      }
    }

    const tickerData = {
      name: data.Name || null,
      currentPrice: currentPrice,
      dividendPerShare: data.DividendPerShare || null,
      exDividendDate: data.ExDividendDate || null,
      dividendDate: data.DividendDate || null
    };

    return NextResponse.json({ data: tickerData });
  } catch (e: any) {
    console.error('Error fetching dividend data:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}