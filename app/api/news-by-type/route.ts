import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

const { news, newsTypes } = schema;

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
    // If typeName provided, get detailed news for that type
    if (typeName) {
      const offset = (page - 1) * pageSize;

      // Get news_type_id first
      const newsTypeData = await db
        .select()
        .from(newsTypes)
        .where(eq(newsTypes.type_name, typeName))
        .limit(1);

      if (!newsTypeData || newsTypeData.length === 0) {
        return NextResponse.json({ error: 'News type not found' }, { status: 404 });
      }

      const data = await db
        .select({
          newsId: news.news_id,
          userId: news.user_id,
          ticker: news.ticker,
          exchangeId: news.exchange_id,
          companyName: news.company_name,
          newsTypeId: news.news_type_id,
          newsDescription: news.news_description,
          newsDate: news.news_date,
          alertDate: news.alert_date,
          alertNotes: news.alert_notes,
          newsSource: news.news_source,
          newsUrl: news.news_url,
          tags: news.tags,
          createdAt: news.created_at,
          updatedAt: news.updated_at,
          news_type: {
            type_code: newsTypes.type_code,
            type_name: newsTypes.type_name,
          },
        })
        .from(news)
        .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
        .where(
          and(
            eq(news.user_id, userId),
            eq(news.news_type_id, newsTypeData[0].news_type_id)
          )
        )
        .orderBy(desc(news.news_date))
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(
          and(
            eq(news.user_id, userId),
            eq(news.news_type_id, newsTypeData[0].news_type_id)
          )
        );

      return NextResponse.json({ data, total: countResult[0]?.count || 0 });
    }

    // Get summary by type (using view)
    const data = await db.all(sql`
      SELECT * FROM news_summary_by_type
      WHERE user_id = ${userId}
      ORDER BY total_news_items DESC
    `);

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching news by type:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}