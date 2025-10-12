import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const year = searchParams.get('year');
  const quarter = searchParams.get('quarter');
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

    // If year and quarter are provided, get detailed dividends
    if (year && quarter) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const yearNum = parseInt(year);
      const quarterNum = parseInt(quarter);

      // Calculate start and end dates for the quarter
      const startMonth = (quarterNum - 1) * 3 + 1;
      const endMonth = quarterNum * 3 + 1;
      const startDate = `${yearNum}-${String(startMonth).padStart(2, '0')}-01`;
      const endDate = quarterNum === 4 ? `${yearNum + 1}-01-01` : `${yearNum}-${String(endMonth).padStart(2, '0')}-01`;

      const { data, error, count } = await supabase
        .from('dividends')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('ex_dividend_date', startDate)
        .lt('ex_dividend_date', endDate)
        .order('ex_dividend_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({ data, total: count || 0 });
    }

    // Otherwise, get summary by quarter
    const { data, error } = await supabase
      .from('dividend_summary_by_quarter')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('quarter', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching dividends by quarter:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}