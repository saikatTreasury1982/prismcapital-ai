export interface Dividend {
  dividend_id: number;
  user_id: string;
  position_id: number;
  ticker: string;
  ex_dividend_date: string;
  payment_date: string | null;
  dividend_per_share: number;
  shares_owned: number;
  total_dividend_amount: number; // Generated column
  Currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDividendInput {
  ticker: string;
  position_id: number;
  ex_dividend_date: string;
  payment_date?: string;
  dividend_per_share: number;
  shares_owned: number;
  total_dividend_amount: number; // Generated column
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
  position_id: number;  // Change from string to number
  ticker: string;
  ticker_name?: string | null;
  total_shares: number;
  average_cost: number;
  current_market_price?: number | null;
}

export interface AlphaVantageOverview {
  Symbol: string;
  DividendPerShare: string;
  ExDividendDate: string;
  DividendDate: string;
}