export interface NewsType {
  news_type_id: number;
  type_code: string;
  type_name: string;
}

export interface News {
  news_id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  news_type_id: number;
  news_description: string;
  news_date: string;
  alert_date: string | null;
  alert_notes: string | null;
  news_source: string | null;
  news_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NewsWithDetails extends News {
  news_type: NewsType;
}

export interface CreateNewsInput {
  ticker: string;
  exchange_id: number;
  company_name?: string;
  news_type_id: number;
  news_description: string;
  news_date: string;
  alert_date?: string;
  alert_notes?: string;
  news_source?: string;
  news_url?: string;
  tags?: string[];
}

export interface NewsSummaryByTicker {
  user_id: string;
  ticker: string;
  company_name: string;
  exchange_id: number;
  total_news: number;
  unread_count: number;
  important_count: number;
  latest_news_date: string;
}

export interface NewsSummaryByType {
  user_id: string;
  news_type_id: number;
  type_code: string;
  type_name: string;
  total_news: number;
  unread_count: number;
  latest_news_date: string;
}