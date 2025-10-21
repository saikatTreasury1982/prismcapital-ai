import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { CreateDividendInput } from '../../lib/types/dividend';

const { dividends } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dividendId = searchParams.get('dividendId');

    if (!dividendId) {
      return NextResponse.json({ error: 'dividendId required' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(dividends)
      .where(eq(dividends.dividend_id, dividendId))
      .limit(1);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Dividend not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch dividend' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, dividendData } = body as { userId: string; dividendData: CreateDividendInput };

    if (!userId || !dividendData) {
      return NextResponse.json({ error: 'userId and dividendData required' }, { status: 400 });
    }

    const dividendId = `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const data = await db
      .insert(dividends)
      .values({
        dividend_id: dividendId,  // ← map variable to snake_case key
        user_id: userId,          // ← map variable to snake_case key
        ticker: dividendData.ticker,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        dividend_yield: dividendData.dividend_yield || null,
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
    const { dividendId, dividendData } = body;

    if (!dividendId || !dividendData) {
      return NextResponse.json({ error: 'dividendId and dividendData required' }, { status: 400 });
    }

    const data = await db
      .update(dividends)
      .set({
        ticker: dividendData.ticker,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        dividend_yield: dividendData.dividend_yield || null,
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
    const dividendId = searchParams.get('dividendId');

    if (!dividendId) {
      return NextResponse.json({ error: 'dividendId required' }, { status: 400 });
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