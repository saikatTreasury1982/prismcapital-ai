import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { realizedPnlHistory } = schema;

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
    const realizationId = parseInt(id);
    
    if (isNaN(realizationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { sale_date, quantity, average_cost, sale_price, fees, notes } = body;

    // Calculate derived values
    const total_cost = quantity * average_cost;
    const total_proceeds = quantity * sale_price;
    const realized_pnl = total_proceeds - total_cost;

    // Update the record
    await db
      .update(realizedPnlHistory)
      .set({
        sale_date,
        quantity,
        average_cost,
        sale_price,
        total_cost,
        total_proceeds,
        realized_pnl,
        fees,
        notes,
      })
      .where(eq(realizedPnlHistory.realization_id, realizationId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update realized trade error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}