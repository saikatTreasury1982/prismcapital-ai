import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    // Use Yahoo Finance search API
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=0`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Yahoo Finance API request failed');
    }

    const data = await response.json();
    
    // Get the first quote result
    const quote = data?.quotes?.[0];
    
    if (!quote) {
      return NextResponse.json({ 
        name: null, 
        error: 'Ticker not found' 
      });
    }

    return NextResponse.json({
      name: quote.longname || quote.shortname || ticker,
      symbol: quote.symbol || ticker,
      exchange: quote.exchange || null,
      type: quote.quoteType || null,
    });

  } catch (error: any) {
    console.error('Ticker lookup error:', error);
    return NextResponse.json(
      { name: null, error: error.message || 'Failed to lookup ticker' },
      { status: 500 }
    );
  }
}