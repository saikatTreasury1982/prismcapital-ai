import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db, schema } from '@/app/lib/db';

const { authPasskeys, authSessions } = schema;

const rpID = process.env.NEXTAUTH_WEBAUTHN_RP_ID!;
const origin = process.env.NEXTAUTH_WEBAUTHN_ORIGIN!;

export async function POST(request: Request) {
  try {
    const { userId, credential, challenge } = await request.json();

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      const credId = Buffer.from(credentialID).toString('base64');

      await db.insert(authPasskeys).values({
        credential_id: credId,
        user_id: userId,
        public_key: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        device_name: 'Device',
      });

      // Create session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(authSessions).values({
        session_id: sessionId,
        user_id: userId,
        session_status: 'OPEN',
        credential_id: credId,
      });

      return NextResponse.json({ verified: true, sessionId });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (e: any) {
    console.error('Passkey verification error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}