import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { cashMovements, cashMovementDirections } = schema;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // Get movements with direction info
    const movementsData = await db
      .select({
        movement: cashMovements,
        direction: cashMovementDirections,
      })
      .from(cashMovements)
      .leftJoin(
        cashMovementDirections,
        eq(cashMovements.direction_id, cashMovementDirections.direction_id)
      )
      .where(eq(cashMovements.user_id, session.user.id))
      .orderBy(desc(cashMovements.transaction_date))
      .limit(pageSize)
      .offset(offset);

    const movements = movementsData.map(m => ({
      ...m.movement,
      direction: m.direction
    }));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cashMovements)
      .where(eq(cashMovements.user_id, session.user.id));

    return NextResponse.json({
      data: movements,
      total: countResult[0]?.count || 0,
      page,
      pageSize
    });
  } catch (error: any) {
    console.error('Error fetching all movements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}