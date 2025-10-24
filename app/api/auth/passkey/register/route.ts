import { NextResponse } from 'next/server';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';

const { users, authPasskeys } = schema;

const rpName = process.env.NEXTAUTH_WEBAUTHN_RP_NAME!;
const rpID = process.env.NEXTAUTH_WEBAUTHN_RP_ID!;
const origin = process.env.NEXTAUTH_WEBAUTHN_ORIGIN!;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.user_id, userId)).limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: user[0].email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    return NextResponse.json(options);
  } catch (e: any) {
    console.error('Passkey registration error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}