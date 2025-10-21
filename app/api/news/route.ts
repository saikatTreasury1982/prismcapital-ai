import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { CreateNewsInput } from '../../lib/types/news';

const { news } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json({ error: 'newsId required' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(news)
      .where(eq(news.newsId, newsId))
      .limit(1);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, newsData } = body as { userId: string; newsData: CreateNewsInput };

    if (!userId || !newsData) {
      return NextResponse.json({ error: 'userId and newsData required' }, { status: 400 });
    }

    const newsId = `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const data = await db
      .insert(news)
      .values({
        newsId,
        userId,
        ticker: newsData.ticker,
        exchangeId: newsData.exchange_id,
        companyName: newsData.company_name || null,
        newsTypeId: newsData.news_type_id,
        newsDescription: newsData.news_description,
        newsDate: newsData.news_date,
        alertDate: newsData.alert_date || null,
        alertNotes: newsData.alert_notes || null,
        newsSource: newsData.news_source || null,
        newsUrl: newsData.news_url || null,
        tags: Array.isArray(newsData.tags) ? newsData.tags.join(',') : newsData.tags || null,
      })
      .returning();

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create news' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { newsId, newsData } = body;

    if (!newsId || !newsData) {
      return NextResponse.json({ error: 'newsId and newsData required' }, { status: 400 });
    }

    const data = await db
      .update(news)
      .set({
        ticker: newsData.ticker,
        exchangeId: newsData.exchange_id,
        companyName: newsData.company_name || null,
        newsTypeId: newsData.news_type_id,
        newsDescription: newsData.news_description,
        newsDate: newsData.news_date,
        alertDate: newsData.alert_date || null,
        alertNotes: newsData.alert_notes || null,
        newsSource: newsData.news_source || null,
        newsUrl: newsData.news_url || null,
        tags: Array.isArray(newsData.tags) ? newsData.tags.join(',') : newsData.tags || null,
      })
      .where(eq(news.newsId, newsId))
      .returning();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to update news' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json({ error: 'newsId required' }, { status: 400 });
    }

    await db
      .delete(news)
      .where(eq(news.newsId, newsId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete news' }, { status: 500 });
  }
}