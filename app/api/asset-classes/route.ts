import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { asc } from 'drizzle-orm';

const { assetClasses } = schema;

export async function GET(request: Request) {
  try {
    const data = await db
      .select()
      .from(assetClasses)
      .orderBy(asc(assetClasses.class_code));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch asset classes' }, { status: 500 });
  }
}