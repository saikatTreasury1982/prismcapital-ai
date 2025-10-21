import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, inArray, desc } from 'drizzle-orm';

const { tradeLots } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Build conditions
    const conditions = [];
    conditions.push(eq(tradeLots.user_id, userId));
    
    if (ticker) {
      conditions.push(eq(tradeLots.ticker, ticker));
    }
    
    if (status) {
      if (status === 'OPEN') {
        conditions.push(inArray(tradeLots.lot_status, ['OPEN', 'PARTIAL']));
      } else {
        conditions.push(eq(tradeLots.lot_status, status));
      }
    }

    const data = await db
      .select()
      .from(tradeLots)
      .where(and(...conditions))
      .orderBy(desc(tradeLots.entry_date));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch trade lots' }, { status: 500 });
  }
}