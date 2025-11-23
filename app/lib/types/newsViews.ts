export interface NewsSummaryByTicker {
  user_id: string;
  ticker: string;
  company_name: string | null;
  total_news_items: number;
  earnings_count: number;
  other_news_count: number;
  earliest_news_date: string;
  latest_news_date: string;
}

export interface NewsSummaryByType {
  user_id: string;
  type_name: string;
  total_news_items: number;
  unique_tickers: number;
  earliest_news_date: string;
  latest_news_date: string;
}

export interface NewsListItem {
  news_id: number;
  ticker: string;
  company_name: string | null;
  news_type_id: number;
  news_description: string;
  news_date: string;
  news_source: string | null;
  news_url: string | null;
  tags: string[] | null;
  alert_date: string | null;
  alert_notes: string | null;
  news_type: {
    type_code: string;
    type_name: string;
  };
}