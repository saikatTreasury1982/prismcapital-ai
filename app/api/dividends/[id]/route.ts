import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { dividends } = schema;

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
    const dividendId = parseInt(id);
    
    if (isNaN(dividendId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { ex_dividend_date, payment_date, dividend_per_share, shares_owned, dividend_yield, notes } = body;

    // Calculate total dividend amount
    const total_dividend_amount = dividend_per_share * shares_owned;

    // Update the dividend
    await db
      .update(dividends)
      .set({
        ex_dividend_date,
        payment_date,
        dividend_per_share,
        shares_owned,
        total_dividend_amount,
        dividend_yield,
        notes,
        updated_at: new Date().toISOString(),
      })
      .where(eq(dividends.dividend_id, dividendId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update dividend error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update dividend' }, { status: 500 });
  }
}