import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { positions } = schema;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { positionId, newStrategy } = await request.json();

    await db
      .update(positions)
      .set({ 
        strategy: newStrategy,
        // updated_at will be set by trigger automatically
      })
      .where(
        and(
          eq(positions.position_id, positionId),
          eq(positions.user_id, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating strategy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}