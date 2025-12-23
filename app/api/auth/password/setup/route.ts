import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const { users, authPasswords } = schema;

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.user_id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if password already exists
    const existingPassword = await db
      .select()
      .from(authPasswords)
      .where(eq(authPasswords.user_id, userId))
      .limit(1);

    if (existingPassword && existingPassword.length > 0) {
      return NextResponse.json({ error: 'Password already set. Use password reset instead.' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const passwordId = `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert new password
    await db.insert(authPasswords).values({
      password_id: passwordId,
      user_id: userId,
      password_hash: passwordHash,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password set successfully' 
    });
  } catch (e: any) {
    console.error('Password setup error:', e);
    return NextResponse.json({ error: e.message || 'Failed to set password' }, { status: 500 });
  }
}