import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateDividendInput } from '../../lib/types/dividend';

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
        payment_date: dividendData.payment_date,
        dividend_per_share: dividendData.dividend_per_share,
        shares_owned: dividendData.shares_owned,
        total_dividend_amount: dividendData.total_dividend_amount,
        dividend_yield: dividendData.dividend_yield || null,
        year: dividendData.year,
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