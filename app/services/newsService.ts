import { createClient } from '@/utils/supabase/server';
import { 
  News, 
  NewsWithDetails, 
  CreateNewsInput,
  NewsType,
  NewsSummaryByTicker,
  NewsSummaryByType
} from '../lib/types/news';

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