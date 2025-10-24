import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, asc } from 'drizzle-orm';

const { positions } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Build conditions array
    const conditions = [eq(positions.user_id, userId)];
    
    if (isActive === 'true') {
      conditions.push(eq(positions.is_active, 1));
    } else if (isActive === 'false') {
      conditions.push(eq(positions.is_active, 0));
    }

    const data = await db
      .select()
      .from(positions)
      .where(and(...conditions))
      .orderBy(asc(positions.ticker));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch positions' }, { status: 500 });
  }
}