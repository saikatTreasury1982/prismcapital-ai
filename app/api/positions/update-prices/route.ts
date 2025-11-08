import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch price for ${ticker}`);
      return null;
    }
    
    const data = await response.json();
    
    // Get the current price from Yahoo Finance
    const quote = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    if (quote) {
      return parseFloat(quote);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Get all active positions
    const activePositions = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.user_id, userId),
          eq(positions.is_active, 1)
        )
      );

    if (activePositions.length === 0) {
      return NextResponse.json({ 
        message: 'No active positions to update',
        updated: 0 
      });
    }

    // Fetch prices for all tickers with minimal delay
    const updates: Array<{ ticker: string; price: number | null; success: boolean }> = [];
    
    for (const position of activePositions) {
      try {
        // Small delay to be respectful (500ms instead of 12 seconds!)
        if (updates.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const price = await fetchCurrentPrice(position.ticker);
  
        if (price !== null) {
          // Update position with new price
          await db
            .update(positions)
            .set({ 
              current_market_price: price,
              updated_at: new Date().toISOString()
            })
            .where(eq(positions.position_id, position.position_id));

          updates.push({ ticker: position.ticker, price, success: true });
        } else {
          updates.push({ ticker: position.ticker, price: null, success: false });
        }
      } catch (error) {
        console.log('Error updating price, continuing with next ticker');
        updates.push({ ticker: position.ticker, price: null, success: false });
      }
    }

    const successCount = updates.filter(u => u.success).length;

    return NextResponse.json({ 
      message: `Updated ${successCount} of ${activePositions.length} positions`,
      updated: successCount,
      total: activePositions.length,
      details: updates
    });

  } catch (error: any) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update prices' },
      { status: 500 }
    );
  }
}