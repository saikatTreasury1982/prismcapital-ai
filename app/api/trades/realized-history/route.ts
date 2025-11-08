import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { auth } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all realized P&L history for this user
    const result = await db.$client.execute({
      sql: `
        SELECT 
          realization_id,
          user_id,
          position_id,
          ticker,
          sale_date,
          quantity,
          average_cost,
          total_cost,
          sale_price,
          total_proceeds,
          realized_pnl,
          entry_date,
          position_currency,
          fees,
          notes,
          created_at
        FROM realized_pnl_history
        WHERE user_id = ?
        ORDER BY sale_date DESC
      `,
      args: [userId],
    });

    const history = result.rows.map(row => ({
      realization_id: row.realization_id,
      user_id: row.user_id,
      position_id: row.position_id,
      ticker: row.ticker,
      sale_date: row.sale_date,
      quantity: Number(row.quantity) || 0,
      average_cost: Number(row.average_cost) || 0,
      total_cost: Number(row.total_cost) || 0,
      sale_price: Number(row.sale_price) || 0,
      total_proceeds: Number(row.total_proceeds) || 0,
      realized_pnl: Number(row.realized_pnl) || 0,
      entry_date: row.entry_date,
      position_currency: row.position_currency || 'USD',
      fees: Number(row.fees) || 0,
      notes: row.notes,
      created_at: row.created_at,
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching realized P&L history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}