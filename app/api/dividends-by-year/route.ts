import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const year = searchParams.get('year');
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

    // If year is provided, get detailed dividends
    if (year) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const yearNum = parseInt(year);

      const { data, error, count } = await supabase
        .from('dividends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('year', yearNum)
        .order('payment_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({ data, total: count || 0 });
    }

    // Otherwise, get summary by year
    const { data, error } = await supabase
      .from('dividend_summary_by_year')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by year:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}