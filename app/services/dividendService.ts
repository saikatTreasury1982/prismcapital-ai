import { createClient } from '@/utils/supabase/server';
import { 
  Dividend,
  DividendSummaryByTicker,
  DividendSummaryByQuarter,
  DividendSummaryByYear,
  PositionForDividend
} from '../lib/types/dividend';

export async function getOpenPositionsForDividends(userId: string): Promise<PositionForDividend[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('positions')
    .select('position_id, ticker, ticker_name, total_shares, average_cost, current_market_price')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('ticker', { ascending: true });

  if (error) throw error;
  
  return data as PositionForDividend[];
}

export async function getDividendSummaryByTicker(userId: string): Promise<DividendSummaryByTicker[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('dividend_summary_by_ticker')
    .select('*')
    .eq('user_id', userId)
    .order('total_dividends_received', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getDividendSummaryByQuarter(userId: string): Promise<DividendSummaryByQuarter[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('dividend_summary_by_quarter')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('quarter', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getDividendSummaryByYear(userId: string): Promise<DividendSummaryByYear[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('dividend_summary_by_year')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function getDividendsByTicker(
  userId: string, 
  ticker: string, 
  page: number = 1, 
  pageSize: number = 5
) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('dividends')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .order('payment_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  return { data: data as Dividend[], total: count || 0 };
}

export async function getDividendsByQuarter(
  userId: string,
  year: number,
  quarter: number,
  page: number = 1,
  pageSize: number = 5
) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Get dividends for the specific quarter
  const { data, error, count } = await supabase
    .from('dividends')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('year', year)
    .filter('payment_date', 'gte', `${year}-${(quarter - 1) * 3 + 1}-01`)
    .filter('payment_date', 'lt', `${year}-${quarter * 3 + 1}-01`)
    .order('payment_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  return { data: data as Dividend[], total: count || 0 };
}

export async function getDividendsByYear(
  userId: string,
  year: number,
  page: number = 1,
  pageSize: number = 5
) {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('dividends')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('year', year)
    .order('payment_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  return { data: data as Dividend[], total: count || 0 };
}