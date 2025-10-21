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
          eq(assetClassifications.user_id, userId),
          eq(assetClassifications.ticker, ticker),
          eq(assetClassifications.exchange_id, parseInt(exchangeId))
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
          eq(assetClassifications.user_id, userId),
          eq(assetClassifications.ticker, classificationData.ticker.toUpperCase()),
          eq(assetClassifications.exchange_id, classificationData.exchange_id)
        )
      )
      .limit(1);

    let data;

    if (existing.length > 0) {
      // Update existing
      data = await db
        .update(assetClassifications)
        .set({
          class_id: classificationData.class_id,
          type_id: classificationData.type_id || null,
          updated_at: new Date().toISOString(),
        })
        .where(eq(assetClassifications.classification_id, existing[0].classification_id))
        .returning();
    } else {
      // Insert new
      data = await db
      .insert(assetClassifications)
      .values({
        classification_id: classificationId,  // ← map variable to snake_case key
        user_id: userId,  // ← changed
        ticker: classificationData.ticker.toUpperCase(),
        exchange_id: classificationData.exchange_id,  // ← changed
        class_id: classificationData.class_id,  // ← changed
        type_id: classificationData.type_id || null,  // ← changed
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
      .where(eq(assetClassifications.classification_id, classificationId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete asset classification' }, { status: 500 });
  }
}