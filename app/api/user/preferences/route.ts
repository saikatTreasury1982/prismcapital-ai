import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const result = await db.$client.execute({
      sql: `
        SELECT 
          up.*,
          ps.strategy_name as pnl_strategy_name
        FROM user_preferences up
        LEFT JOIN pnl_strategies ps ON up.pnl_strategy_id = ps.strategy_id
        WHERE up.user_id = ?
      `,
      args: [userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}