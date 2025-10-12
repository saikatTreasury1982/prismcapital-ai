import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  try {
    // Get AlphaVantage API key from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: apiKeyData, error: keyError } = await supabase
      .from('system_api_keys')
      .select('api_key')
      .eq('service_id', 1)
      .eq('environment', 'PRODUCTION')
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();

    if (keyError || !apiKeyData?.api_key) {
      throw new Error('Failed to fetch AlphaVantage API key');
    }

    const apiKey = apiKeyData.api_key;

    // Call AlphaVantage OVERVIEW endpoint (includes company name, dividend info, and more)
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('AlphaVantage API request failed');
    }

    const data = await response.json();

    // Check for API errors
    if (data.Note || data.Information || data['Error Message']) {
      return NextResponse.json({ 
        error: data.Note || data.Information || data['Error Message'] || 'API error'
      }, { status: 400 });
    }

    // Also get current price from GLOBAL_QUOTE
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    let currentPrice = null;

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      if (quoteData['Global Quote'] && quoteData['Global Quote']['05. price']) {
        currentPrice = quoteData['Global Quote']['05. price'];
      }
    }

    // Extract all relevant data
    const tickerData = {
      // Company info
      name: data.Name || null,
      // Current price
      currentPrice: currentPrice,
      // Dividend data
      dividendPerShare: data.DividendPerShare || null,
      dividendYield: data.DividendYield || null,
      exDividendDate: data.ExDividendDate || null,
      dividendDate: data.DividendDate || null
    };

    return NextResponse.json({ data: tickerData });
  } catch (e: any) {
    console.error('Error fetching dividend data:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}