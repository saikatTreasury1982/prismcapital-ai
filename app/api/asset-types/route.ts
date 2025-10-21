import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, asc } from 'drizzle-orm';

const { assetTypes } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    let query = db.select().from(assetTypes).orderBy(asc(assetTypes.typeName));

    // Filter by class_id if provided
    const data = classId
      ? await query.where(eq(assetTypes.classId, parseInt(classId)))
      : await query;

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch asset types' }, { status: 500 });
  }
}