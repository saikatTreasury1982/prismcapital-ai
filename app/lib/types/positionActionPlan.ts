export interface PositionActionPlan {
  plan_id: number;
  user_id: string;
  position_id: number;
  action_type: 'LIQUIDATE' | 'PARTIAL_SELL' | 'REINVEST' | 'ADD_POSITION';
  sell_percentage: number | null;
  sell_shares: number | null;
  expected_proceeds: number | null;
  reinvest_ticker: string | null;
  reinvest_amount: number | null;
  withdraw_amount: number | null;
  withdraw_currency: string | null;
  // For ADD_POSITION action
  buy_shares: number | null;
  entry_price: number | null;
  fees: number | null;
  new_average_cost: number | null;
  new_total_shares: number | null;
  last_dividend_per_share: number | null;
  projected_dividend: number | null;
  previous_dividend: number | null;
  notes: string | null;
  status: 'DRAFT' | 'EXECUTED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  // Joined from positions table
  ticker?: string;
  ticker_name?: string;
  total_shares?: number;
  average_cost?: number;
  current_market_price?: number;
  position_currency?: string;
}

export interface CreatePositionActionPlanInput {
  position_id: number;
  action_type: 'LIQUIDATE' | 'PARTIAL_SELL' | 'REINVEST' | 'ADD_POSITION';
  sell_percentage?: number;
  sell_shares?: number;
  expected_proceeds?: number;
  reinvest_ticker?: string;
  reinvest_amount?: number;
  withdraw_amount?: number;
  withdraw_currency?: string;
  // For ADD_POSITION
  buy_shares?: number;
  entry_price?: number;
  fees?: number;
  new_average_cost?: number;
  new_total_shares?: number;
  last_dividend_per_share?: number;
  projected_dividend?: number;
  previous_dividend?: number;
  notes?: string;
}

export interface UpdatePositionActionPlanInput {
  action_type?: 'LIQUIDATE' | 'PARTIAL_SELL' | 'REINVEST' | 'ADD_POSITION';
  sell_percentage?: number | null;
  sell_shares?: number | null;
  expected_proceeds?: number | null;
  reinvest_ticker?: string | null;
  reinvest_amount?: number | null;
  withdraw_amount?: number | null;
  withdraw_currency?: string | null;
  // For ADD_POSITION
  buy_shares?: number | null;
  entry_price?: number | null;
  fees?: number | null;
  new_average_cost?: number | null;
  new_total_shares?: number | null;
  last_dividend_per_share?: number | null;
  projected_dividend?: number | null;
  previous_dividend?: number | null;
  notes?: string | null;
  status?: 'DRAFT' | 'EXECUTED' | 'CANCELLED';
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  lastUpdate: string;
}