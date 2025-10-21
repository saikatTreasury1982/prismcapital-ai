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
        .where(eq(newsTypes.typeName, typeName))
        .limit(1);

      if (!newsTypeData || newsTypeData.length === 0) {
        return NextResponse.json({ error: 'News type not found' }, { status: 404 });
      }

      const data = await db
        .select({
          newsId: news.newsId,
          userId: news.userId,
          ticker: news.ticker,
          exchangeId: news.exchangeId,
          companyName: news.companyName,
          newsTypeId: news.newsTypeId,
          newsDescription: news.newsDescription,
          newsDate: news.newsDate,
          alertDate: news.alertDate,
          alertNotes: news.alertNotes,
          newsSource: news.newsSource,
          newsUrl: news.newsUrl,
          tags: news.tags,
          createdAt: news.createdAt,
          updatedAt: news.updatedAt,
          news_type: {
            type_code: newsTypes.typeCode,
            type_name: newsTypes.typeName,
          },
        })
        .from(news)
        .leftJoin(newsTypes, eq(news.newsTypeId, newsTypes.newsTypeId))
        .where(
          and(
            eq(news.userId, userId),
            eq(news.newsTypeId, newsTypeData[0].newsTypeId)
          )
        )
        .orderBy(desc(news.newsDate))
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(
          and(
            eq(news.userId, userId),
            eq(news.newsTypeId, newsTypeData[0].newsTypeId)
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