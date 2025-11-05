import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions, systemApiKeys } = schema;

interface AlphaVantageQuote {
  'Global Quote': {
    '05. price': string;
  };
}

async function getAlphaVantageApiKey(): Promise<string> {
  const data = await db
    .select()
    .from(systemApiKeys)
    .where(
      and(
        eq(systemApiKeys.service_id, 1),
        eq(systemApiKeys.is_active, 1)
      )
    )
    .limit(1);

  if (!data || data.length === 0 || !data[0].api_key) {
    throw new Error('AlphaVantage API key not found');
  }
  
  return data[0].api_key;
}

async function fetchCurrentPrice(ticker: string, apiKey: string): Promise<number | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch price for ${ticker}`);
      return null;
    }
    
    const data: AlphaVantageQuote = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return parseFloat(data['Global Quote']['05. price']);
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

    // Get API key
    const apiKey = await getAlphaVantageApiKey();

    // Fetch prices for all tickers (with delay to respect rate limits)
    const updates: Array<{ ticker: string; price: number | null; success: boolean }> = [];
    
    for (const position of activePositions) {
        // Check if request was aborted (user navigated away)
        try {
            // Wait 12 seconds between calls
            if (updates.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 12000));
            }

            const price = await fetchCurrentPrice(position.ticker, apiKey);
      
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
            // If request aborted, stop processing
            console.log('Request aborted, stopping price updates');
            break;
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