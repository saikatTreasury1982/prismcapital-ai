export interface StagingRecord {
  staging_id: number;
  user_id: string;
  import_batch_id: string;
  import_timestamp: string;
  status: 'imported' | 'edited' | 'rejected_duplicate' | 'rejected_error';
  rejection_reason: string | null;
  moomoo_fill_id: string;
  moomoo_order_id: string | null;
  ticker: string;
  ticker_name: string | null;
  transaction_type_id: 1 | 2; // Only BUY or SELL
  transaction_date: string;
  quantity: number;
  price: number;
  trade_value: number;
  fees: number;
  transaction_currency: string;
  strategy_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}