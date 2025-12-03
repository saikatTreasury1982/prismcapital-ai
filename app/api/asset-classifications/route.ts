import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { assetClassifications } = schema;

// GET - Fetch classification for a ticker
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = session.user.id;
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'ticker required' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(assetClassifications)
      .where(
        and(
          eq(assetClassifications.user_id, userId),
          eq(assetClassifications.ticker, ticker)
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classificationData } = body;
    const userId = session.user.id;

    if (!classificationData) {
      return NextResponse.json({ error: 'classificationData required' }, { status: 400 });
    }

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
      .where(eq(assetClassifications.classification_id, parseInt(classificationId)));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete asset classification' }, { status: 500 });
  }
}