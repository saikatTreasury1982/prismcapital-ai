
import { News, NewsWithDetails, CreateNewsInput, NewsType } from '../lib/types/news';
import { NewsSummaryByTicker, NewsSummaryByType, NewsListItem } from '../lib/types/newsViews';
import { db, schema } from '../lib/db';
import { eq, ilike, desc, and } from 'drizzle-orm';

const { 
  newsTypes, 
  positions, 
  news, 
  newsSummaryByTicker, 
  newsSummaryByType,
  earningsNews,
  generalNews
} = schema;

export async function getNewsTypes(): Promise<NewsType[]> {
  const data = await db
    .select()
    .from(newsTypes)
    .orderBy(newsTypes.type_name);
  
  return data;
}

export async function hasOpenPosition(ticker: string): Promise<boolean> {
  const data = await db
    .select()
    .from(positions)
    .where(ilike(positions.ticker, ticker))
    .limit(1);
  
  return data.length > 0;
}

export async function getAllNews(userId: string): Promise<NewsWithDetails[]> {
  const data = await db
    .select({
      news: news,
      news_type: newsTypes,
    })
    .from(news)
    .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
    .where(eq(news.user_id, userId))
    .orderBy(desc(news.news_date));
  
  return data.map(d => ({
    ...d.news,
    news_type: d.news_type
  })) as NewsWithDetails[];
}

export async function getEarningsNews(userId: string): Promise<NewsWithDetails[]> {
  const data = await db
    .select()
    .from(earningsNews)
    .where(eq(earningsNews.user_id, userId))
    .orderBy(desc(earningsNews.news_date));
  
  return data as any;
}

export async function getGeneralNews(userId: string): Promise<NewsWithDetails[]> {
  const data = await db
    .select()
    .from(generalNews)
    .where(eq(generalNews.user_id, userId))
    .orderBy(desc(generalNews.news_date));
  
  return data as any;
}

export async function getNewsSummaryByTicker(userId: string): Promise<NewsSummaryByTicker[]> {
  const data = await db
    .select()
    .from(newsSummaryByTicker)
    .where(eq(newsSummaryByTicker.user_id, userId))
    .orderBy(desc(newsSummaryByTicker.latest_news_date));
  
  return data as any;
}

export async function getNewsSummaryByType(userId: string): Promise<NewsSummaryByType[]> {
  const data = await db
    .select()
    .from(newsSummaryByType)
    .where(eq(newsSummaryByType.user_id, userId));
  
  return data as any;
}

export async function getNewsSummaryByTickerView(userId: string): Promise<NewsSummaryByTicker[]> {
  const data = await db
    .select()
    .from(newsSummaryByTicker)
    .where(eq(newsSummaryByTicker.user_id, userId))
    .orderBy(desc(newsSummaryByTicker.latest_news_date));
  
  return data as any;
}

export async function getNewsSummaryByTypeView(userId: string): Promise<NewsSummaryByType[]> {
  const data = await db
    .select()
    .from(newsSummaryByType)
    .where(eq(newsSummaryByType.user_id, userId))
    .orderBy(desc(newsSummaryByType.total_news_items));
  
  return data as any;
}

export async function getNewsByTicker(userId: string, ticker: string, page: number = 1, pageSize: number = 5) {
  const offset = (page - 1) * pageSize;
  
  const data = await db
    .select({
      news: news,
      news_type: newsTypes,
    })
    .from(news)
    .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
    .where(
      and(
        eq(news.user_id, userId),
        eq(news.ticker, ticker)
      )
    )
    .orderBy(desc(news.news_date))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.user_id, userId),
        eq(news.ticker, ticker)
      )
    );
  
  return { 
    data: data.map(d => ({ ...d.news, news_type: d.news_type })) as any, 
    total: countResult.length 
  };
}

export async function getNewsByType(userId: string, typeName: string, page: number = 1, pageSize: number = 5) {
  const offset = (page - 1) * pageSize;
  
  const data = await db
    .select({
      news: news,
      news_type: newsTypes,
    })
    .from(news)
    .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
    .where(eq(news.user_id, userId))
    .orderBy(desc(news.news_date))
    .limit(pageSize)
    .offset(offset);

  const filtered = data
    .filter(d => d.news_type?.type_name === typeName)
    .map(d => ({ ...d.news, news_type: d.news_type })) as NewsListItem[];

  return { data: filtered, total: filtered.length };
}

export async function getNewsById(newsId: string) {
  const data = await db
    .select({
      news: news,
      news_type: newsTypes,
    })
    .from(news)
    .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
    .where(eq(news.news_id, newsId))
    .limit(1);

  if (!data || data.length === 0) throw new Error('News not found');
  
  return { ...data[0].news, news_type: data[0].news_type } as NewsListItem;
}