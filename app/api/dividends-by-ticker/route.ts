import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const ticker = searchParams.get('ticker');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '5');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If ticker is provided, get detailed dividends for that ticker
    if (ticker) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('dividends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('ticker', ticker)
        .order('payment_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({ data, total: count || 0 });
    }

    // Otherwise, get summary by ticker
    const { data, error } = await supabase
      .from('dividend_summary_by_ticker')
      .select('*')
      .eq('user_id', userId)
      .order('total_dividends_received', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by ticker:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}