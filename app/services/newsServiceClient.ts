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

// services/newsServiceClient.ts
export async function hasOpenPositionClient(ticker: string): Promise<boolean> {
  const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) throw new Error('Failed to check open position');
  const json = await res.json();
  return Boolean(json.hasPosition);
}
