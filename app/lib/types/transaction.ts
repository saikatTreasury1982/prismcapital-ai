export interface Transaction {
  transaction_id: number;
  user_id: string;
  ticker: string;
  transaction_type_id: number;
  transaction_date: string;
  quantity: number;
  price: number;
  fees: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  trade_lot_id?: string;
  transaction_currency: string;
  trade_value: number;
}

export interface CreateTransactionInput {
  ticker: string;
  transaction_type_id: number;
  transaction_date: string;
  quantity: number;
  price: number;
  fees?: number;
  transaction_currency?: string;
  notes?: string;
  strategy_id: number;
}

export interface UpdateTransactionInput {
  fees?: number;
  notes?: string;
}

export interface Position {
  position_id: number;
  user_id: string;
  ticker: string;
  total_shares: number;
  average_cost: number;
  current_market_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  realized_pnl: number;
  is_active: number;
  opened_date?: string;
  created_at: string;
  updated_at: string;
  strategy_id?: number;
  position_currency: string;
  ticker_name?: string;
}

export interface Exchange {
  exchange_code: string;
  exchange_name: string;
  country_code?: string;
  created_at: string;
  exchange_type: string;
}

// Transaction Type (Buy/Sell)
export interface TransactionType {
  type_id: number;
  type_name: string;
  type_multiplier: number;
}

// Asset Classification Types
export interface AssetClass {
  class_code: string;
  class_name: string;
  description: string | null;
  created_at: string;
}

export interface AssetType {
  type_code: string;
  type_name: string;
  class_id: number | null;
  description: string | null;
  created_at: string;
}

export interface AssetClassification {
  classification_id: string;
  user_id: string;
  ticker: string;
  exchange_id: string;
  class_id: string;
  type_id: string;
  created_at: string;
  updated_at: string;
}