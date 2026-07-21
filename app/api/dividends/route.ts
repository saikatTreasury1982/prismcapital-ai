import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { CreateDividendInput } from '../../lib/types/dividend';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { dividends } = schema;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dividendId = searchParams.get('dividendId');
    const recent = searchParams.get('recent');

    // Single record fetch (used by edit prefill)
    if (dividendId) {
      const result = await db
        .select()
        .from(dividends)
        .where(
          and(
            eq(dividends.dividend_id, parseInt(dividendId)),
            eq(dividends.user_id, session.user.id)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ error: 'Dividend not found' }, { status: 404 });
      }

      return NextResponse.json({ data: result[0] });
    }

    // Recent / flat list for the current user (newest first)
    const limit = recent ? 5 : 100;
    const result = await db
      .select()
      .from(dividends)
      .where(eq(dividends.user_id, session.user.id))
      .orderBy(desc(dividends.ex_dividend_date))
      .limit(limit);

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error fetching dividend(s):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, dividendData } = body as { userId: string; dividendData: CreateDividendInput };

    if (!userId || !dividendData) {
      return NextResponse.json({ error: 'userId and dividendData required' }, { status: 400 });
    }

    const data = await db
      .insert(dividends)
      .values({
        user_id: userId,
        ticker: dividendData.ticker,
        position_id: dividendData.position_id,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        total_dividend_amount: dividendData.total_dividend_amount,
        Currency: dividendData.Currency || null,
        notes: dividendData.notes || null,
      })
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create dividend' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { dividendId: dividendIdStr, dividendData } = body;

    if (!dividendIdStr || !dividendData) {
      return NextResponse.json({ error: 'dividendId and dividendData required' }, { status: 400 });
    }

    const dividendId = parseInt(dividendIdStr);
    if (isNaN(dividendId)) {
      return NextResponse.json({ error: 'Invalid dividendId' }, { status: 400 });
    }

    const data = await db
      .update(dividends)
      .set({
        ticker: dividendData.ticker,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        Currency: dividendData.Currency || null,
        notes: dividendData.notes || null,
      })
      .where(eq(dividends.dividend_id, dividendId))
      .returning();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Dividend not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update dividend' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dividendIdStr = searchParams.get('dividendId');

    if (!dividendIdStr) {
      return NextResponse.json({ error: 'dividendId required' }, { status: 400 });
    }

    const dividendId = parseInt(dividendIdStr);
    if (isNaN(dividendId)) {
      return NextResponse.json({ error: 'Invalid dividendId' }, { status: 400 });
    }

    await db
      .delete(dividends)
      .where(eq(dividends.dividend_id, dividendId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete dividend' }, { status: 500 });
  }
}