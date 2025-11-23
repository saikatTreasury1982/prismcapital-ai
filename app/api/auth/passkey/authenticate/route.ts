import { NextResponse } from 'next/server';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';

const { users, authPasskeys, authSessions } = schema;

const rpID = process.env.NEXTAUTH_WEBAUTHN_RP_ID!;
const origin = process.env.NEXTAUTH_WEBAUTHN_ORIGIN!;

// GET - Generate authentication options
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if user has passkey
    const passkeys = await db
      .select()
      .from(authPasskeys)
      .where(eq(authPasskeys.user_id, userId));

    if (passkeys.length === 0) {
      // No passkey exists - user needs to register one
      return NextResponse.json({ 
        error: 'No passkey found', 
        needsRegistration: true 
      }, { status: 404 });
    }

    // Passkey exists but may not be for this domain
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map(p => ({
        id: Buffer.from(p.credential_id, 'base64'),
        type: 'public-key',
      })),
    });

    return NextResponse.json(options);
  } catch (e: any) {
    console.error('Auth options error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Verify authentication
export async function POST(request: Request) {
  try {
    const { userId, credential, challenge } = await request.json();

    // Get user's passkey
    const passkeys = await db
      .select()
      .from(authPasskeys)
      .where(eq(authPasskeys.user_id, userId));

    if (passkeys.length === 0) {
      return NextResponse.json({ error: 'No passkey found' }, { status: 404 });
    }

    const passkey = passkeys[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(passkey.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(passkey.public_key, 'base64'),
        counter: passkey.counter || 0,
      },
    });

    if (verification.verified) {
      // Update counter
      await db
        .update(authPasskeys)
        .set({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .where(eq(authPasskeys.credential_id, passkey.credential_id));

      // Create session
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(authSessions).values({
        session_id: sessionId,
        user_id: userId,
        session_status: 'OPEN',
        credential_id: passkey.credential_id,
      });

      return NextResponse.json({ verified: true, sessionId });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (e: any) {
    console.error('Auth verification error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}