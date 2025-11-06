import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, or } from 'drizzle-orm';

const { users } = schema;

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }

    // Try to find user by user_id or email
    const user = await db
      .select({
        user_id: users.user_id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(users)
      .where(
        or(
          eq(users.user_id, identifier),
          eq(users.email, identifier)
        )
      )
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ userId: user[0].user_id });
  } catch (e: any) {
    console.error('User lookup error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}