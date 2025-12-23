import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { ticker } = await context.params;
    const userId = session.user.id;

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    console.log('Fetching position for ticker:', ticker, 'user:', userId);

    const position = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.user_id, userId),
          eq(positions.ticker, ticker.toUpperCase()),
          eq(positions.is_active, 1)
        )
      )
      .limit(1);

    console.log('Position query result:', position);

    if (position.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: position[0] });
  } catch (e: any) {
    console.error('Error fetching position:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}