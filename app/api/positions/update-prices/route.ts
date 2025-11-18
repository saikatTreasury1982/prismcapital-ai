import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, sql } from 'drizzle-orm';
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

    // STEP 1: Get all active positions WITH asset class info
    const activePositions = await db
      .select({
        position: positions,
        assetClass: schema.assetClasses,
      })
      .from(positions)
      .leftJoin(
        schema.assetClassifications,
        and(
          eq(positions.user_id, schema.assetClassifications.user_id),
          eq(positions.ticker, schema.assetClassifications.ticker)
        )
      )
      .leftJoin(
        schema.assetClasses,
        eq(schema.assetClassifications.class_id, schema.assetClasses.class_code)
      )
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

    // STEP 2: Fetch prices with crypto ticker adjustment
    const updates: Array<{ ticker: string; price: number | null; success: boolean }> = [];
    
    for (const row of activePositions) {
      try {
        const position = row.position;
        const assetClass = row.assetClass;
        
        // Small delay to be respectful
        if (updates.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // For crypto, append -{currency} to ticker (e.g., XRP-USD, BTC-EUR)
        const tickerForAPI = assetClass?.class_code === 'CRYPTO' 
          ? `${position.ticker}-${position.position_currency}`
          : position.ticker;

        const price = await fetchCurrentPrice(tickerForAPI);
  
        if (price !== null) {
          // Update position with new price
          await db
            .update(positions)
            .set({ 
              current_market_price: price,
              updated_at: sql`datetime('now')`
            })
            .where(eq(positions.position_id, position.position_id));

          updates.push({ ticker: position.ticker, price, success: true });
        } else {
          updates.push({ ticker: position.ticker, price: null, success: false });
        }
      } catch (error) {
        console.log('Error updating price, continuing with next ticker');
        updates.push({ ticker: row.position.ticker, price: null, success: false });
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