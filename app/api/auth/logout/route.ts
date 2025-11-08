import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';

const { authSessions } = schema;

export async function POST(request: Request) {
  try {
    // Handle both regular fetch and sendBeacon formats
    let userId;
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      userId = body.userId;
    } else {
      // sendBeacon sends as text/plain by default
      const body = await request.text();
      try {
        const parsed = JSON.parse(body);
        userId = parsed.userId;
      } catch {
        userId = body; // If not JSON, treat as plain userId
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Close all open sessions for this user
    await db
      .update(authSessions)
      .set({
        session_status: 'CLOSED',
        closed_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(authSessions.user_id, userId),
          eq(authSessions.session_status, 'OPEN')
        )
      );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Logout error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}