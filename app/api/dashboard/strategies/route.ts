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
          p.strategy,
          ts.strategy_name,
          ts.description as strategy_description,
          COUNT(*) as position_count,
          GROUP_CONCAT(
            p.position_id || '|' ||
            p.ticker || '|' || 
            COALESCE(p.ticker_name, p.ticker) || '|' || 
            p.total_shares || '|' || 
            p.average_cost || '|' || 
            COALESCE(p.current_market_price, 0) || '|' ||
            COALESCE(p.unrealized_pnl, 0) || '|' ||
            COALESCE(p.opened_date, '') || '|' ||
            (p.total_shares * p.average_cost) || '|' ||
            COALESCE(p.current_value, 0),
            ','
          ) as positions_data
        FROM positions p
        LEFT JOIN trade_strategies ts ON p.strategy = ts.strategy_code
        WHERE p.user_id = ? AND p.is_active = 1
        GROUP BY p.strategy, ts.strategy_name, ts.description
        ORDER BY position_count DESC
      `,
      args: [userId],
    });

    const strategyBreakdown = result.rows.map(row => {
      const positionsData = (row.positions_data as string)?.split(',').map(pos => {
      const [positionId, ticker, tickerName, totalShares, avgCost, currentPrice, unrealizedPnl, openedDate, capitalInvested, currentValue] = pos.split('|');
      
      // Calculate daysHeld from opened_date
      const daysHeld = openedDate ? Math.floor(
        (new Date().getTime() - new Date(openedDate).getTime()) / (1000 * 60 * 60 * 24)
      ) : 0;
      
      return {
        position_id: Number(positionId) || 0,
        ticker: ticker || '',
        ticker_name: tickerName || ticker || '',
        total_shares: Number(totalShares) || 0,
        average_cost: Number(avgCost) || 0,
        current_market_price: Number(currentPrice) || 0,
        unrealized_pnl: Number(unrealizedPnl) || 0,
        opened_date: openedDate || '',
        daysHeld: daysHeld,
        capital_invested: Number(capitalInvested) || 0,
        current_value: Number(currentValue) || 0,
      };
    }) || [];

      return {
        strategy_code: row.strategy || 'UNKNOWN',
        strategy_name: row.strategy_name || 'Unknown Strategy',
        description: row.strategy_description || 'No description available',
        position_count: Number(row.position_count) || 0,
        positions: positionsData,
      };
    });

    return NextResponse.json({ strategies: strategyBreakdown });
  } catch (error: any) {
    console.error('Dashboard strategies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}