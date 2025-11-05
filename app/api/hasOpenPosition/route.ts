import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const userId = session.user.id;
  
  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  try {
    const data = await db
      .select({
        positionId: positions.position_id,
        tickerName: positions.ticker_name,
      })
      .from(positions)
      .where(
        and(
          eq(positions.user_id, userId),
          eq(positions.is_active, 1),
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