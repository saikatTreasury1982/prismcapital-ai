import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';

const { users, authOtpCodes } = schema;

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Find user by phone (assuming phone stored in users table)
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, phone)) // Adjust based on your user lookup
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save OTP
    await db.insert(authOtpCodes).values({
      otp_id: otpId,
      user_id: user[0].user_id,
      phone_number: phone,
      code,
      expires_at: expiresAt,
    });

    // TODO: Send SMS via Twilio (skip for now since you're using passkey)
    console.log('📱 OTP Code:', code); // Log for testing

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('OTP send error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}