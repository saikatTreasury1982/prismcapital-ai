import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';
import { CreateNewsInput } from '../../lib/types/news';

const { news } = schema;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const newsIdStr = searchParams.get('newsId');

    if (!newsIdStr) {
      return NextResponse.json({ error: 'newsId required' }, { status: 400 });
    }

    const newsId = parseInt(newsIdStr);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid newsId' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(news)
      .where(eq(news.news_id, newsId))  // Now using integer
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

    // Remove news_id generation - let database auto-increment
    const data = await db
      .insert(news)
      .values({
        // news_id is removed - database will auto-generate it
        user_id: userId,
        ticker: newsData.ticker,
        company_name: newsData.company_name || null,
        news_type_id: newsData.news_type_id,
        news_description: newsData.news_description,
        news_date: newsData.news_date,
        alert_date: newsData.alert_date || null,
        alert_notes: newsData.alert_notes || null,
        news_source: newsData.news_source || null,
        news_url: newsData.news_url || null,
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
    const { newsId: newsIdStr, newsData } = body;

    if (!newsIdStr || !newsData) {
      return NextResponse.json({ error: 'newsId and newsData required' }, { status: 400 });
    }

    const newsId = parseInt(newsIdStr);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid newsId' }, { status: 400 });
    }

    const data = await db
      .update(news)
      .set({
        ticker: newsData.ticker,
        company_name: newsData.company_name || null,
        news_type_id: newsData.news_type_id,
        news_description: newsData.news_description,
        news_date: newsData.news_date,
        alert_date: newsData.alert_date || null,
        alert_notes: newsData.alert_notes || null,
        news_source: newsData.news_source || null,
        news_url: newsData.news_url || null,
        tags: Array.isArray(newsData.tags) ? newsData.tags.join(',') : newsData.tags || null,
      })
      .where(eq(news.news_id, newsId))  // Now using integer
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
    const newsIdStr = searchParams.get('newsId');

    if (!newsIdStr) {
      return NextResponse.json({ error: 'newsId required' }, { status: 400 });
    }

    const newsId = parseInt(newsIdStr);
    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid newsId' }, { status: 400 });
    }

    await db
      .delete(news)
      .where(eq(news.news_id, newsId));  // Now using integer

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to delete news' }, { status: 500 });
  }
}