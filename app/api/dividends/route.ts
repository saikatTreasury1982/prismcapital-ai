import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateDividendInput } from '../../lib/types/dividend';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dividendId = searchParams.get('dividendId');

    if (!dividendId) {
      return NextResponse.json({ error: 'dividendId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('dividends')
      .select('*')
      .eq('dividend_id', dividendId)
      .single();

    if (error) {
      console.error('Dividend fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
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

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('dividends')
      .insert({
        user_id: userId,
        ticker: dividendData.ticker,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        // total_dividend_amount is auto-generated, don't insert it
        dividend_yield: dividendData.dividend_yield || null,
        Currency: dividendData.Currency || null,
        notes: dividendData.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Dividend insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('dividends')
      .update({
        ticker: dividendData.ticker,
        ex_dividend_date: dividendData.ex_dividend_date,
        payment_date: dividendData.payment_date || null,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        dividend_yield: dividendData.dividend_yield || null,
        Currency: dividendData.Currency || null,
        notes: dividendData.notes || null
      })
      .eq('dividend_id', dividendId)
      .select()
      .single();

    if (error) {
      console.error('Dividend update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('dividends')
      .delete()
      .eq('dividend_id', dividendId);

    if (error) {
      console.error('Dividend delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete dividend' }, { status: 500 });
  }
}