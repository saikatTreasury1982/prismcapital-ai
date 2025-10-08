import { createClient } from '@/utils/supabase/client';
import { CreateNewsInput, News } from '../lib/types/news';

export async function createNews(userId: string, input: CreateNewsInput): Promise<News> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('news')
    .insert({
      user_id: userId,
      ticker: input.ticker,
      exchange_id: input.exchange_id,
      company_name: input.company_name || null,
      news_type_id: input.news_type_id,
      status_id: input.status_id,
      news_description: input.news_description,
      news_date: input.news_date,
      alert_date: input.alert_date || null,
      alert_notes: input.alert_notes || null,
      news_source: input.news_source || null,
      news_url: input.news_url || null,
      tags: input.tags || null
    })
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

export async function updateNewsStatus(newsId: string, statusId: number): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('news')
    .update({ status_id: statusId })
    .eq('news_id', newsId);

  if (error) throw error;
}