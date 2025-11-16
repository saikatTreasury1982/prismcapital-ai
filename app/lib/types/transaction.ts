// Transaction Types
export interface Transaction {
  transaction_id: string;
  user_id: string;
  ticker: string;
  exchange_id: string;
  transaction_type_id: number; // 1=Buy, 2=Sell
  strategy_id?: number;
  transaction_date: string;
  quantity: number;
  price: number;
  fees: number;
  transaction_currency: string;
  trade_value: number; // Generated column
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  ticker: string;
  exchange_id: string;
  transaction_type_id: number;
  strategy_id: number;
  transaction_date: string;
  quantity: number;
  price: number;
  fees?: number;
  transaction_currency?: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  fees?: number;
  notes?: string;
}

// Trade Lot Types
export interface TradeLot {
  lot_id: string;
  user_id: string;
  ticker: string;
  exchange_id: string;
  entry_date: string;
  entry_price: number;
  quantity: number;
  entry_fees: number;
  entry_transaction_id: string;
  exit_date: string | null;
  exit_price: number | null;
  exit_fees: number | null;
  exit_transaction_id: string | null;
  lot_status: 'OPEN' | 'PARTIAL' | 'CLOSED';
  trade_currency: string;
  realized_pl: number | null;
  realized_pl_percent: number | null;
  trade_hold_days: number | null;
  trade_strategy: number | null;
  created_at: string;
  updated_at: string;
}

// Position Type (already exists but adding for completeness)
export interface Position {
  position_id: string;
  user_id: string;
  ticker: string;
  ticker_name?: string;
  exchange_id: string;
  total_shares: number;
  average_cost: number;
  current_market_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  realized_pnl: number;
  is_active: boolean;
  opened_date: string;
  closed_date?: string;
  strategy_id?: number;
  position_currency: string;
  asset_class?: string | null;        
  asset_class_code?: string | null;  
}

// Exchange Type
export interface Exchange {
  exchange_code: string;
  exchange_name: string;
  country_code: string;
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
  class_id: number;
  class_code: string;
  class_name: string;
  description: string | null;
  created_at: string;
}

export interface AssetType {
  type_id: number;
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
  exchange_id: number;
  class_id: number;
  type_id: number | null;
  created_at: string;
  updated_at: string;
}