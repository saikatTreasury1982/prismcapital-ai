import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

const { news, newsTypes } = schema;

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
    // If ticker provided, get detailed news with join
    if (ticker) {
      const offset = (page - 1) * pageSize;

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
            eq(news.ticker, ticker)
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
            eq(news.ticker, ticker)
          )
        );

      return NextResponse.json({ data, total: countResult[0]?.count || 0 });
    }

    // Get summary by ticker (using view)
    const data = await db.all(sql`
      SELECT * FROM news_summary_by_ticker
      WHERE user_id = ${userId}
      ORDER BY latest_news_date DESC
    `);

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('Error fetching news by ticker:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}