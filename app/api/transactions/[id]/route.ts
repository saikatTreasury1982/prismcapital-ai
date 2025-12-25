import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { transactions } = schema;

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const transactionId = parseInt(id);
    
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { transaction_date, quantity, price, fees, notes } = body;

    // Calculate trade value
    const trade_value = quantity * price;

    // Update the transaction
    await db
      .update(transactions)
      .set({
        transaction_date,
        quantity,
        price,
        trade_value,
        updated_at: new Date().toISOString(),
      })
      .where(eq(transactions.transaction_id, transactionId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update transaction error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update transaction' }, { status: 500 });
  }
}