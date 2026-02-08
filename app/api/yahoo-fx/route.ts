import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from'); // e.g., "USD"
  const to = searchParams.get('to');     // e.g., "AUD"

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to currencies required' }, { status: 400 });
  }

  // If same currency, return 1
  if (from === to) {
    return NextResponse.json({ rate: 1, from, to });
  }

  try {
    // Yahoo Finance format: USDAUD=X for USD to AUD
    const pair = `${from}${to}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Yahoo Finance FX API request failed');
    }

    const data = await response.json();
    
    const quote = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (!quote) {
      return NextResponse.json({ 
        error: 'Exchange rate not available',
        rate: null 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      rate: quote,
      from,
      to,
      timestamp: new Date().toISOString()
    });

  } catch (e: any) {
    console.error('Error fetching Yahoo Finance FX rate:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed to fetch exchange rate',
      rate: null 
    }, { status: 500 });
  }
}