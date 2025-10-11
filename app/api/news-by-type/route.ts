import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const typeName = searchParams.get('typeName');
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

    // If typeName is provided, get detailed news for that type
    if (typeName) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: newsTypeData, error: typeError } = await supabase
        .from('news_types')
        .select('news_type_id')
        .eq('type_name', typeName)
        .single();

      if (typeError) throw typeError;

      const { data, error, count } = await supabase
        .from('news')
        .select(`
          *,
          news_type:news_types(type_code, type_name)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('news_type_id', newsTypeData.news_type_id)
        .order('news_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({ data, total: count || 0 });
    }

    // Otherwise, get summary by type
    const { data, error } = await supabase
      .from('news_summary_by_type')
      .select('*')
      .eq('user_id', userId)
      .order('total_news_items', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching news by type:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}