import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get positions grouped by strategy with descriptions
    const result = await db.$client.execute({
      sql: `
        SELECT 
          p.strategy_id,
          ts.strategy_name,
          ts.description as strategy_description,
          COUNT(*) as position_count,
          GROUP_CONCAT(
            p.ticker || '|' || 
            p.ticker_name || '|' || 
            p.total_shares || '|' || 
            p.average_cost || '|' || 
            p.current_market_price || '|' ||
            p.unrealized_pnl || '|' ||
            p.position_currency,
            ','
          ) as positions_data
        FROM positions p
        LEFT JOIN trade_strategies ts ON p.strategy_id = ts.strategy_id
        WHERE p.user_id = ? AND p.is_active = 1
        GROUP BY p.strategy_id, ts.strategy_name, ts.description
        ORDER BY position_count DESC
      `,
      args: [userId],
    });

    const strategyBreakdown = result.rows.map(row => {
      const positionsData = (row.positions_data as string)?.split(',').map(pos => {
        const [ticker, tickerName, quantity, avgCost, currentPrice, unrealizedPnl, currency] = pos.split('|');
        return {
          ticker: ticker || '',
          tickerName: tickerName || '',
          quantity: Number(quantity) || 0,
          averageCost: Number(avgCost) || 0,
          currentPrice: Number(currentPrice) || 0,
          unrealizedPnl: Number(unrealizedPnl) || 0,
          currency: currency || 'USD',
        };
      }) || [];

      return {
        strategyId: Number(row.strategy_id),
        strategyName: row.strategy_name || 'Unknown',
        strategyDescription: row.strategy_description || 'No description available',
        positionCount: Number(row.position_count) || 0,
        positions: positionsData,
      };
    });

    return NextResponse.json({ strategies: strategyBreakdown });
  } catch (error: any) {
    console.error('Dashboard strategies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}