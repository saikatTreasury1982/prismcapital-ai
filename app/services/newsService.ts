import { createClient } from '@/utils/supabase/server';
import { News, NewsWithDetails, CreateNewsInput, NewsType } from '../lib/types/news';
import { NewsSummaryByTicker, NewsSummaryByType, NewsListItem } from '../lib/types/newsViews';

export async function getNewsTypes(): Promise<NewsType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news_types')
    .select('*')
    .order('type_name', { ascending: true });

  if (error) throw error;
  
  return data;
}

export async function hasOpenPosition(ticker: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('positions')
    .select('id')
    .ilike('ticker', ticker)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

export async function getAllNews(userId: string): Promise<NewsWithDetails[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news')
    .select(`
      *,
      news_type:news_types(*),
      news_status:news_status(*)
    `)
    .eq('user_id', userId)
    .order('news_date', { ascending: false });

  if (error) throw error;
  
  return data as NewsWithDetails[];
}

export async function getEarningsNews(userId: string): Promise<NewsWithDetails[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('earnings_news')
    .select('*')
    .eq('user_id', userId)
    .order('news_date', { ascending: false });

  if (error) throw error;
  
  return data as NewsWithDetails[];
}

export async function getGeneralNews(userId: string): Promise<NewsWithDetails[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('general_news')
    .select('*')
    .eq('user_id', userId)
    .order('news_date', { ascending: false });

  if (error) throw error;
  
  return data as NewsWithDetails[];
}

export async function getNewsSummaryByTicker(userId: string): Promise<NewsSummaryByTicker[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news_summary_by_ticker')
    .select('*')
    .eq('user_id', userId)
    .order('latest_news_date', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getNewsSummaryByType(userId: string): Promise<NewsSummaryByType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news_summary_by_type')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  
  return data;
}

export async function getNewsSummaryByTickerView(userId: string): Promise<NewsSummaryByTicker[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news_summary_by_ticker')
    .select('*')
    .eq('user_id', userId)
    .order('latest_news_date', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getNewsSummaryByTypeView(userId: string): Promise<NewsSummaryByType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news_summary_by_type')
    .select('*')
    .eq('user_id', userId)
    .order('total_news_items', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getNewsByTicker(userId: string, ticker: string, page: number = 1, pageSize: number = 5) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('news')
    .select(`
      *,
      news_type:news_types(type_code, type_name)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .order('news_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  return { data: data as NewsListItem[], total: count || 0 };
}

export async function getNewsByType(userId: string, typeName: string, page: number = 1, pageSize: number = 5) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('news')
    .select(`
      *,
      news_type:news_types(type_code, type_name)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('news_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  // Filter by type_name (since we're joining)
  const filtered = (data as NewsListItem[]).filter(
    item => item.news_type.type_name === typeName
  );
  
  return { data: filtered, total: count || 0 };
}

export async function getNewsById(newsId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('news')
    .select(`
      *,
      news_type:news_types(type_code, type_name)
    `)
    .eq('news_id', newsId)
    .single();

  if (error) throw error;
  
  return data as NewsListItem;
}