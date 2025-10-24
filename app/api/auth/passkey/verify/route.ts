import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db, schema } from '@/app/lib/db';

const { authPasskeys } = schema;

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

      const credId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(authPasskeys).values({
        credential_id: credId,
        user_id: userId,
        public_key: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        device_name: 'Device',
      });

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (e: any) {
    console.error('Passkey verification error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}