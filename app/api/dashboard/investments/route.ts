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

    // Fetch total realized P/L
    const realizedPnLResult = await db.$client.execute({
      sql: `
        SELECT COALESCE(SUM(realized_pnl), 0) as total_realized_pnl
        FROM realized_pnl_history
        WHERE user_id = ?
      `,
      args: [userId],
    });

    const totalRealizedPnL = Number(realizedPnLResult.rows[0]?.total_realized_pnl) || 0;

    // Fetch active positions
    const activePositions = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.user_id, userId),
          eq(positions.is_active, 1)
        )
      );

    // Calculate aggregates and derived fields
    let totalInvested = 0;
    let totalMarketValue = 0;

    const positionsWithDetails = activePositions.map(position => {
    const quantity = position.total_shares ?? 0;
    const avgCost = position.average_cost ?? 0;
    const capitalInvested = quantity * avgCost;
    
    const openedDate = position.opened_date ? new Date(position.opened_date) : new Date();
    const daysHeld = Math.floor(
        (new Date().getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentValue = position.current_value ?? 0;
    const unrealizedPnl = position.unrealized_pnl ?? 0;

    totalInvested += capitalInvested;
    totalMarketValue += currentValue;

    return {
        ticker: position.ticker ?? '',
        tickerName: position.ticker_name ?? '',
        quantity: quantity,
        averageCost: avgCost,
        capitalInvested: capitalInvested,
        daysHeld: daysHeld,
        currentValue: currentValue,
        moneyness: unrealizedPnl,
        currency: position.position_currency ?? 'USD',
    };
    });

    return NextResponse.json({
      summary: {
        totalInvested,
        totalMarketValue,
        totalUnrealizedPnL: totalMarketValue - totalInvested,
        totalRealizedPnL: totalRealizedPnL,
      },
      positions: positionsWithDetails,
    });
    
  } catch (error: any) {
    console.error('Dashboard investments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}