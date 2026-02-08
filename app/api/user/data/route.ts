import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { users } = schema;

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const userData = await db
      .select({
        user_id: users.user_id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        home_currency: users.home_currency,
        resident_country: users.resident_country,
      })
      .from(users)
      .where(eq(users.user_id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userData[0]);
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}