export interface Dividend {
  dividend_id: string;
  user_id: string;
  ticker: string;
  ex_dividend_date: string;
  payment_date: string | null;
  dividend_per_share: number;
  shares_owned: number;
  total_dividend_amount: number; // Generated column
  dividend_yield: number | null;
  Currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDividendInput {
  ticker: string;
  ex_dividend_date: string;
  payment_date?: string;
  dividend_per_share: number;
  shares_owned: number;
  dividend_yield?: number;
  notes?: string;
  Currency?: string;
}

export interface DividendSummaryByTicker {
  user_id: string;
  ticker: string;
  total_dividend_payments: number;
  total_dividends_received: number;
  avg_dividend_per_share: number;
  latest_ex_dividend_date: string;
  latest_payment_date: string;
  earliest_ex_dividend_date: string;
  earliest_payment_date: string;
}

export interface DividendSummaryByQuarter {
  user_id: string;
  year: number;
  quarter: number;
  stocks_paid_dividends: number;
  total_dividend_payments: number;
  total_dividends_received: number;
  quarter_start_date: string;
  quarter_end_date: string;
  earliest_payment_date: string;
  latest_payment_date: string;
}

export interface DividendSummaryByYear {
  user_id: string;
  year: number;
  stocks_paid_dividends: number;
  total_dividend_payments: number;
  total_dividends_received: number;
  earliest_ex_dividend_date: string;
  latest_ex_dividend_date: string;
  earliest_payment_date: string;
  latest_payment_date: string;
}

export interface PositionForDividend {
  ticker: string;
  ticker_name: string | null;
  total_shares: number;
  average_cost: number;
  current_market_price: number | null;
  position_id: string;
}

export interface AlphaVantageOverview {
  Symbol: string;
  DividendPerShare: string;
  DividendYield: string;
  ExDividendDate: string;
  DividendDate: string;
}