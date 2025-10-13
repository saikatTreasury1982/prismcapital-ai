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

export async function updateNews(newsId: string, input: CreateNewsInput): Promise<News> {
  const response = await fetch('/api/news', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newsId,
      newsData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update news');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteNews(newsId: string): Promise<void> {
  const response = await fetch(`/api/news?newsId=${newsId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete news');
  }
}
