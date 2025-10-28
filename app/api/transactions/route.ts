import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc } from 'drizzle-orm';

const { transactions } = schema;

// GET - Fetch single transaction or list of transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const userId = searchParams.get('userId');
    const ticker = searchParams.get('ticker');

    // Fetch single transaction
    if (transactionId) {
      const data = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transaction_id, transactionId))
        .limit(1);

      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      return NextResponse.json({ data: data[0] });
    }

    // Fetch transactions list
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Build query with optional ticker filter
    const conditions = ticker
      ? and(
          eq(transactions.user_id, userId),
          eq(transactions.ticker, ticker)
        )
      : eq(transactions.user_id, userId);

    const data = await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.transaction_date));

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, transactionData } = body;

    if (!userId || !transactionData) {
      return NextResponse.json({ error: 'userId and transactionData required' }, { status: 400 });
    }

    // Generate a unique transaction ID (you can use UUID library or any other method)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const data = await db
      .insert(transactions)
      .values({
        transaction_id: transactionId,
        user_id: userId,
        ticker: transactionData.ticker.toUpperCase(),
        exchange_id: transactionData.exchange_id,
        transaction_type_id: transactionData.transaction_type_id,
        transaction_date: transactionData.transaction_date,
        quantity: transactionData.quantity,
        price: transactionData.price,
        fees: transactionData.fees || 0,
        transaction_currency: transactionData.transaction_currency || 'USD',
        notes: transactionData.notes || null,
      })
      .returning();

    // Update position based on user's PnL strategy
    const userPrefs = await db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.user_id, userId))
      .limit(1);

    if (userPrefs && userPrefs.length > 0 && userPrefs[0].pnl_strategy_id === 1) {
      // Aggregated strategy - update positions table
      const { aggregateToPosition, reducePosition } = await import('@/app/services/positionService');
      
      // Determine transaction type (BUY or SELL)
      // Assuming transaction_type_id: 1 = BUY, 2 = SELL (adjust based on your DB)
      if (transactionData.transaction_type_id === 1) {
        await aggregateToPosition({
          user_id: userId,
          ticker: transactionData.ticker.toUpperCase(),
          exchange_id: transactionData.exchange_id,
          quantity: transactionData.quantity,
          price: transactionData.price,
          transaction_date: transactionData.transaction_date,
          strategy_id: 1, // Aggregated strategy
          transaction_currency: transactionData.transaction_currency || 'USD',
        });
      } else if (transactionData.transaction_type_id === 2) {
        await reducePosition({
          user_id: userId,
          ticker: transactionData.ticker.toUpperCase(),
          exchange_id: transactionData.exchange_id,
          quantity: transactionData.quantity,
          price: transactionData.price,
          transaction_date: transactionData.transaction_date,
          strategy_id: 1,
        });
      }
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create transaction' }, { status: 500 });
  }
}

// PATCH - Update transaction (notes and fees only)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, transactionData } = body;

    if (!transactionId || !transactionData) {
      return NextResponse.json({ error: 'transactionId and transactionData required' }, { status: 400 });
    }

    // Build update object with only allowed fields
    const updateData: any = {};
    if (transactionData.notes !== undefined) updateData.notes = transactionData.notes;
    if (transactionData.fees !== undefined) updateData.fees = transactionData.fees;

    const data = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.transaction_id, transactionId))
      .returning();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE - Delete transaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
    }

    await db
      .delete(transactions)
      .where(eq(transactions.transaction_id, transactionId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete transaction' }, { status: 500 });
  }
}