import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, asc } from 'drizzle-orm';

const { assetTypes } = schema;

export async function GET(request: Request) {
  try {
    const data = await db
      .select()
      .from(assetTypes)
      .orderBy(asc(assetTypes.type_code));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch asset types' }, { status: 500 });
  }
}