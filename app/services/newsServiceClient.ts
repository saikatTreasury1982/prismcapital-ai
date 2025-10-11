import { createClient } from '@/utils/supabase/client';
import { CreateNewsInput, News } from '../lib/types/news';

export async function createNews(userId: string, input: CreateNewsInput): Promise<News> {
  const response = await fetch('/api/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      newsData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create news');
  }

  const result = await response.json();
  return result.data;
}

// services/newsServiceClient.ts
export async function hasOpenPositionClient(ticker: string): Promise<boolean> {
  const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) throw new Error('Failed to check open position');
  const json = await res.json();
  return Boolean(json.hasPosition);
}
