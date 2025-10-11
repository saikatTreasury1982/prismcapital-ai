import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateNewsInput } from '../../lib/types/news';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, newsData } = body as { userId: string; newsData: CreateNewsInput };

    if (!userId || !newsData) {
      return NextResponse.json({ error: 'userId and newsData required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('news')
      .insert({
        user_id: userId,
        ticker: newsData.ticker,
        exchange_id: newsData.exchange_id,
        company_name: newsData.company_name || null,
        news_type_id: newsData.news_type_id,
        news_description: newsData.news_description,
        news_date: newsData.news_date,
        alert_date: newsData.alert_date || null,
        alert_notes: newsData.alert_notes || null,
        news_source: newsData.news_source || null,
        news_url: newsData.news_url || null,
        tags: newsData.tags || null
      })
      .select()
      .single();

    if (error) {
      console.error('News insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create news' }, { status: 500 });
  }
}