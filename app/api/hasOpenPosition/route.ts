import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, sql } from 'drizzle-orm';

const { positions } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const userId = searchParams.get('userId');
  
  if (!ticker || !userId) {
    return NextResponse.json({ error: 'ticker and userId required' }, { status: 400 });
  }

  try {
    const data = await db
      .select({
        positionId: positions.positionId,
        tickerName: positions.tickerName,
      })
      .from(positions)
      .where(
        and(
          eq(positions.userId, userId),
          eq(positions.isActive, 1),
          sql`LOWER(${positions.ticker}) = LOWER(${ticker})`
        )
      )
      .limit(1);

    const hasPosition = data.length > 0;
    const tickerName = hasPosition ? data[0].tickerName : null;

    return NextResponse.json({ 
      hasPosition, 
      tickerName 
    });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}