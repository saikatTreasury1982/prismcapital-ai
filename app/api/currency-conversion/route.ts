import { NextResponse } from 'next/server';

async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  try {
    // Yahoo Finance format for currency pairs: USDAUD=X
    const currencyPair = `${from}${to}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${currencyPair}?interval=1d&range=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch exchange rate for ${currencyPair}`);
      return null;
    }
    
    const data = await response.json();
    
    // Get the current exchange rate from Yahoo Finance
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (rate) {
      return parseFloat(rate);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching exchange rate for ${from} to ${to}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'AUD';
    const amount = parseFloat(searchParams.get('amount') || '1');

    // If same currency, no conversion needed
    if (from === to) {
      return NextResponse.json({
        from,
        to,
        amount,
        convertedAmount: amount,
        rate: 1,
        lastUpdate: new Date().toISOString(),
      });
    }

    // Fetch exchange rate from Yahoo Finance
    const rate = await fetchExchangeRate(from, to);

    if (!rate) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`);
    }

    const convertedAmount = amount * rate;

    return NextResponse.json({
      from,
      to,
      amount,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate: parseFloat(rate.toFixed(4)),
      lastUpdate: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Error fetching currency conversion:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to convert currency' },
      { status: 500 }
    );
  }
}