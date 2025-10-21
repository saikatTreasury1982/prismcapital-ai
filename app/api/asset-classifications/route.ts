import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';

const { assetClassifications } = schema;

// GET - Fetch classification for a ticker
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');
    const exchangeId = searchParams.get('exchangeId');

    if (!userId || !ticker || !exchangeId) {
      return NextResponse.json({ error: 'userId, ticker, and exchangeId required' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(assetClassifications)
      .where(
        and(
          eq(assetClassifications.userId, userId),
          eq(assetClassifications.ticker, ticker),
          eq(assetClassifications.exchangeId, parseInt(exchangeId))
        )
      )
      .limit(1);

    return NextResponse.json({ data: data[0] || null });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch asset classification' }, { status: 500 });
  }
}

// POST - Create or Update classification (upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, classificationData } = body;

    if (!userId || !classificationData) {
      return NextResponse.json({ error: 'userId and classificationData required' }, { status: 400 });
    }

    // Generate classification ID
    const classificationId = `cls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if classification already exists
    const existing = await db
      .select()
      .from(assetClassifications)
      .where(
        and(
          eq(assetClassifications.userId, userId),
          eq(assetClassifications.ticker, classificationData.ticker.toUpperCase()),
          eq(assetClassifications.exchangeId, classificationData.exchange_id)
        )
      )
      .limit(1);

    let data;

    if (existing.length > 0) {
      // Update existing
      data = await db
        .update(assetClassifications)
        .set({
          classId: classificationData.class_id,
          typeId: classificationData.type_id || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(assetClassifications.classificationId, existing[0].classificationId))
        .returning();
    } else {
      // Insert new
      data = await db
        .insert(assetClassifications)
        .values({
          classificationId,
          userId,
          ticker: classificationData.ticker.toUpperCase(),
          exchangeId: classificationData.exchange_id,
          classId: classificationData.class_id,
          typeId: classificationData.type_id || null,
        })
        .returning();
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to save asset classification' }, { status: 500 });
  }
}

// DELETE - Delete classification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classificationId = searchParams.get('classificationId');

    if (!classificationId) {
      return NextResponse.json({ error: 'classificationId required' }, { status: 400 });
    }

    await db
      .delete(assetClassifications)
      .where(eq(assetClassifications.classificationId, classificationId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete asset classification' }, { status: 500 });
  }
}