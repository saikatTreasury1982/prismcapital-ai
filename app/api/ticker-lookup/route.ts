import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    // Use the SAME Yahoo Finance endpoint that works in update-prices
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ 
        name: null, 
        error: 'Ticker not found' 
      });
    }

    const data = await response.json();
    
    // Extract company name from chart metadata
    const meta = data?.chart?.result?.[0]?.meta;
    
    if (!meta) {
      return NextResponse.json({ 
        name: null, 
        error: 'Ticker not found' 
      });
    }

    return NextResponse.json({
      name: meta.longName || meta.shortName || ticker,
      symbol: meta.symbol || ticker,
      exchange: meta.exchangeName || null,
      type: meta.instrumentType || null,
    });

  } catch (error: any) {
    console.error('Ticker lookup error:', error);
    return NextResponse.json(
      { name: null, error: 'Failed to lookup ticker' },
      { status: 500 }
    );
  }
}