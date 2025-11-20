export interface TradeAnalysis {
  analysis_id: number;
  user_id: string;
  ticker: string;
  exchange_code: string | null;
  entry_price: number;
  position_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  shares_to_buy: number | null;
  risk_percentage: number | null;
  reward_percentage: number | null;
  risk_reward_ratio: number | null;
  is_flagged: number; // 0 or 1
  status: 'ANALYZING' | 'FLAGGED' | 'EXECUTED' | 'ARCHIVED';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeAnalysisInput {
  ticker: string;
  exchange_code?: string;
  entry_price: number;
  position_size: number;
  stop_loss?: number;
  take_profit?: number;
  notes?: string;
}

export interface UpdateTradeAnalysisInput {
  exchange_code?: string | null;
  entry_price?: number;
  position_size?: number;
  stop_loss?: number;
  take_profit?: number;
  is_flagged?: number;
  status?: 'ANALYZING' | 'FLAGGED' | 'EXECUTED' | 'ARCHIVED';
  notes?: string;
}