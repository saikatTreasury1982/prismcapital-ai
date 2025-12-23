import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, or } from 'drizzle-orm';

const { users, authPasswords } = schema;

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }

    // Find user by user_id or email
    const user = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.user_id, identifier),
          eq(users.email, identifier)
        )
      )
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].user_id;

    // Check if password exists
    const passwordRecord = await db
      .select()
      .from(authPasswords)
      .where(eq(authPasswords.user_id, userId))
      .limit(1);

    return NextResponse.json({ 
      hasPassword: passwordRecord && passwordRecord.length > 0,
      userId: userId
    });
  } catch (e: any) {
    console.error('Password check error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}