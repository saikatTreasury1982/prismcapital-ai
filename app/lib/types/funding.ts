export interface CashMovement {
  cash_movement_id: string;
  user_id: string;
  home_currency_code: string;
  home_currency_value: number;
  trading_currency_code: string;
  trading_currency_value: number;
  spot_rate: number;
  direction_id: number;
  transaction_date: string;
  period_from: string | null;
  period_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashMovementDirection {
  direction_id: number;
  direction_code: string;
  direction_name: string;
  multiplier: number;
}

export interface CashMovementWithDirection extends CashMovement {
  direction: CashMovementDirection;
}

export interface CashBalanceSummary {
  user_id: string;
  home_currency_code: string;
  trading_currency_code: string;
  total_deposited_home: number;
  total_withdrawn_home: number;
  net_home_currency: number;
  total_deposited_trading: number;
  total_withdrawn_trading: number;
  net_trading_currency: number;
  weighted_avg_rate: number;
  deposit_count: number;
  withdrawal_count: number;
  first_transaction_date: string;
  last_transaction_date: string;
}

export interface UserCurrencies {
  home_currency: string;
  trading_currency: string;
}

export interface CreateCashMovementInput {
  home_currency_value: number;
  spot_rate: number;
  transaction_date: string;
  direction_id: number;
  period_from?: string;
  period_to?: string;
  notes?: string;
}

export interface PeriodStats {
  period_from: string;
  period_to: string | null;
  period_display: string; // "Jan 15, 2024 - Feb 14, 2024"
  inflow_home: number;
  outflow_home: number;
  net_flow_home: number;
  inflow_trading: number;
  outflow_trading: number;
  net_flow_trading: number;
  transaction_count: number;
  cumulative_home: number;
  cumulative_trading: number;
}