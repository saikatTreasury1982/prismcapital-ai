import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const { users, authPasswords } = schema;

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userId = user[0].user_id;

    // Get password hash
    const passwordRecord = await db
      .select()
      .from(authPasswords)
      .where(eq(authPasswords.user_id, userId))
      .limit(1);

    if (!passwordRecord || passwordRecord.length === 0) {
      return NextResponse.json({ error: 'Password not set for this account' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, passwordRecord[0].password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      userId
    });
  } catch (e: any) {
    console.error('Password login error:', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}