import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, desc, and, gte, lte, like, or } from 'drizzle-orm';
import { auth } from '@/app/lib/auth';

const { news, newsTypes } = schema;

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '1000');

    // Fetch all news items with type information
    const data = await db
      .select({
        news_id: news.news_id,
        user_id: news.user_id,
        ticker: news.ticker,
        company_name: news.company_name,
        news_type_id: news.news_type_id,
        news_description: news.news_description,
        news_date: news.news_date,
        alert_date: news.alert_date,
        alert_notes: news.alert_notes,
        news_source: news.news_source,
        news_url: news.news_url,
        tags: news.tags,
        created_at: news.created_at,
        updated_at: news.updated_at,
        news_type: {
          type_code: newsTypes.type_code,
          type_name: newsTypes.type_name,
        },
      })
      .from(news)
      .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
      .where(eq(news.user_id, userId))
      .orderBy(desc(news.news_date));

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error fetching all news:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}