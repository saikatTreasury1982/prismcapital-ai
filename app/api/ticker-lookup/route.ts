import { NextResponse } from 'next/server';
import { searchTicker } from '../../services/alphaVantageService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  
  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const result = await searchTicker(ticker);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { name: null, error: error.message || 'Failed to lookup ticker' },
      { status: 500 }
    );
  }
}