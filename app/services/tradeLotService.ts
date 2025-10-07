import { createClient } from '@/utils/supabase/server';
import { CURRENT_USER_ID } from '@/app/lib/auth';

export interface TradeLot {
  lot_id: string;
  user_id: string;
  ticker: string;
  exchange_id: number;
  entry_date: string;
  entry_price: number;
  quantity: number;
  entry_fees: number;
  entry_transaction_id?: string;
  exit_date?: string;
  exit_price?: number;
  exit_fees?: number;
  exit_transaction_id?: string;
  realized_pnl?: number;
  realized_pnl_percentage?: number;
  holding_days?: number;
  lot_status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'CONVERTED_TO_LONG_TERM';
  trade_type?: string;
  strategy_id?: number;
}

/**
 * Create new trade lot (for DAY_TRADE, SWING_TRADE, POSITION_TRADE)
 */
export async function createTradeLot(transaction: {
  transaction_id: string;
  user_id: string;
  ticker: string;
  exchange_id: number;
  transaction_date: string;
  price: number;
  quantity: number;
  fees: number;
  strategy_id: number;
  transaction_currency: string;
}) {
  const supabase = await createClient();

  // Get strategy code for trade_type
  const { data: strategy } = await supabase
    .from('trade_strategies')
    .select('strategy_code')
    .eq('strategy_id', transaction.strategy_id)
    .single();

  const { data, error } = await supabase
    .from('trade_lots')
    .insert({
      user_id: transaction.user_id,
      ticker: transaction.ticker,
      exchange_id: transaction.exchange_id,
      entry_date: transaction.transaction_date,
      entry_price: transaction.price,
      quantity: transaction.quantity,
      entry_fees: transaction.fees || 0,
      entry_transaction_id: transaction.transaction_id,
      strategy_id: transaction.strategy_id,
      trade_type: strategy?.strategy_code,
      lot_status: 'OPEN',
      entry_currency: transaction.transaction_currency
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create trade lot: ${error.message}`);
  }

  return data;
}

/**
 * Close trade lot when selling
 */
export async function closeTradeLot(closeData: {
  lot_id: string;
  exit_transaction_id: string;
  exit_date: string;
  exit_price: number;
  exit_fees: number;
  exit_currency: string;
}) {
  const supabase = await createClient();

  // Get lot details
  const { data: lot, error: fetchError } = await supabase
    .from('trade_lots')
    .select('*')
    .eq('lot_id', closeData.lot_id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch lot: ${fetchError.message}`);
  }

  // Calculate P&L
  const totalEntry = parseFloat(lot.entry_price) * parseFloat(lot.quantity) + parseFloat(lot.entry_fees || '0');
  const totalExit = closeData.exit_price * parseFloat(lot.quantity) - closeData.exit_fees;
  const realizedPnl = totalExit - totalEntry;
  const realizedPnlPct = (realizedPnl / totalEntry) * 100;

  // Calculate holding days
  const entryDate = new Date(lot.entry_date);
  const exitDate = new Date(closeData.exit_date);
  const holdingDays = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

  const { data, error } = await supabase
    .from('trade_lots')
    .update({
      exit_date: closeData.exit_date,
      exit_price: closeData.exit_price,
      exit_fees: closeData.exit_fees,
      exit_transaction_id: closeData.exit_transaction_id,
      exit_currency: closeData.exit_currency,
      realized_pnl: realizedPnl,
      realized_pnl_percentage: realizedPnlPct,
      holding_days: holdingDays,
      lot_status: 'CLOSED',
      updated_at: new Date().toISOString()
    })
    .eq('lot_id', closeData.lot_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to close lot: ${error.message}`);
  }

  return data;
}

/**
 * Get oldest open lot for a ticker (FIFO)
 */
export async function getOldestOpenLot(
  userId: string,
  ticker: string,
  exchangeId: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trade_lots')
    .select('*')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .eq('exchange_id', exchangeId)
    .eq('lot_status', 'OPEN')
    .order('entry_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch open lot: ${error.message}`);
  }

  return data;
}

/**
 * Get all open lots for a user
 */
export async function getOpenLots(userId: string, ticker?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('trade_lots')
    .select(`
      *,
      exchanges (
        exchange_code,
        exchange_name
      ),
      trade_strategies (
        strategy_code,
        strategy_name
      )
    `)
    .eq('user_id', userId)
    .eq('lot_status', 'OPEN')
    .order('entry_date', { ascending: false });

  if (ticker) {
    query = query.eq('ticker', ticker);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch open lots: ${error.message}`);
  }

  return data;
}

/**
 * Get all closed lots for a user with optional filters
 */
export async function getClosedLots(
  userId: string,
  filters?: {
    ticker?: string;
    strategyCode?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from('trade_lots')
    .select(`
      *,
      exchanges (
        exchange_code,
        exchange_name
      ),
      trade_strategies (
        strategy_code,
        strategy_name
      )
    `)
    .eq('user_id', userId)
    .eq('lot_status', 'CLOSED')
    .order('exit_date', { ascending: false });

  if (filters?.ticker) {
    query = query.eq('ticker', filters.ticker);
  }

  if (filters?.strategyCode) {
    query = query.eq('trade_type', filters.strategyCode);
  }

  if (filters?.startDate) {
    query = query.gte('exit_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('exit_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch closed lots: ${error.message}`);
  }

  return data;
}

/**
 * Convert trade lot to long-term position
 */
export async function convertLotToLongTerm(lotId: string) {
  const supabase = await createClient();

  // Get lot details
  const { data: lot, error: fetchError } = await supabase
    .from('trade_lots')
    .select('*')
    .eq('lot_id', lotId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch lot: ${fetchError.message}`);
  }

  // Get LONG_TERM strategy ID
  const { data: longTermStrategy, error: strategyError } = await supabase
    .from('trade_strategies')
    .select('strategy_id')
    .eq('strategy_code', 'LONG_TERM')
    .single();

  if (strategyError) {
    throw new Error(`Failed to fetch LONG_TERM strategy: ${strategyError.message}`);
  }

  // 1. Update lot status
  const { error: lotError } = await supabase
    .from('trade_lots')
    .update({
      lot_status: 'CONVERTED_TO_LONG_TERM',
      updated_at: new Date().toISOString()
    })
    .eq('lot_id', lotId);

  if (lotError) {
    throw new Error(`Failed to update lot: ${lotError.message}`);
  }

  // 2. Update original transaction's strategy
  const { error: txnError } = await supabase
    .from('transactions')
    .update({
      strategy_id: longTermStrategy.strategy_id,
      trade_lot_id: null, // Unlink from lot
      updated_at: new Date().toISOString()
    })
    .eq('transaction_id', lot.entry_transaction_id);

  if (txnError) {
    throw new Error(`Failed to update transaction: ${txnError.message}`);
  }

  // 3. Aggregate to position (import from positionService)
  const { aggregateToPosition } = await import('./positionService');
  
  await aggregateToPosition({
    user_id: lot.user_id,
    ticker: lot.ticker,
    exchange_id: lot.exchange_id,
    quantity: parseFloat(lot.quantity),
    price: parseFloat(lot.entry_price),
    transaction_date: lot.entry_date,
    strategy_id: longTermStrategy.strategy_id,
    transaction_currency: lot.entry_currency || 'USD'
  });

  return { success: true, message: 'Lot converted to long-term position' };
}