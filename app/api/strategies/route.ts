import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function GET() {
  try {
    const result = await db.$client.execute({
      sql: `
        SELECT 
          strategy_code,
          strategy_name,
          description
        FROM trade_strategies
        ORDER BY strategy_name
      `,
      args: [],
    });

    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}