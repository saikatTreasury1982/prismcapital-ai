import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { asc } from 'drizzle-orm';

const { exchanges } = schema;

export async function GET(request: Request) {
  try {
    const data = await db
      .select()
      .from(exchanges)
      .orderBy(asc(exchanges.exchange_code));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch exchanges' }, { status: 500 });
  }
}