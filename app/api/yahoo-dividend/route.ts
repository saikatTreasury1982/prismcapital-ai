import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const exDividendDate = searchParams.get('exDividendDate');

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  try {
    // Fetch dividend data from Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5y&events=div`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Yahoo Finance API request failed');
    }

    const data = await response.json();

    // Check if dividend data exists
    if (!data.chart?.result?.[0]?.events?.dividends) {
      return NextResponse.json({ 
        amount: null, 
        error: 'No dividend data available from Yahoo Finance' 
      });
    }

    const dividends = data.chart.result[0].events.dividends;

    // If exDividendDate is provided, find matching dividend
    if (exDividendDate) {
      const targetDate = new Date(exDividendDate);
      let closestDividend = null;
      let smallestDiff = Infinity;

      // Find dividend closest to the ex-dividend date (within 3 days)
      for (const timestamp in dividends) {
        const divDate = new Date(parseInt(timestamp) * 1000);
        const diff = Math.abs(divDate.getTime() - targetDate.getTime());
        const daysDiff = diff / (1000 * 60 * 60 * 24);

        if (daysDiff <= 3 && diff < smallestDiff) {
          smallestDiff = diff;
          closestDividend = {
            amount: dividends[timestamp].amount,
            date: divDate.toISOString().split('T')[0]
          };
        }
      }

      if (closestDividend) {
        return NextResponse.json({ 
          amount: closestDividend.amount,
          date: closestDividend.date 
        });
      } else {
        return NextResponse.json({ 
          amount: null, 
          error: 'No dividend found matching the ex-dividend date' 
        });
      }
    }

    // If no specific date requested, return the latest dividend
    let latestTimestamp = 0;
    let latestDividend = null;

    for (const timestamp in dividends) {
      const ts = parseInt(timestamp);
      if (ts > latestTimestamp) {
        latestTimestamp = ts;
        latestDividend = {
          amount: dividends[timestamp].amount,
          date: new Date(ts * 1000).toISOString().split('T')[0]
        };
      }
    }

    return NextResponse.json(latestDividend);

  } catch (e: any) {
    console.error('Error fetching Yahoo Finance dividend:', e);
    return NextResponse.json({ 
      amount: null, 
      error: e.message || 'Failed to fetch dividend from Yahoo Finance' 
    }, { status: 500 });
  }
}