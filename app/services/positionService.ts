import { createClient } from '@/utils/supabase/server';
import { CURRENT_USER_ID } from '@/app/lib/auth';

export interface Position {
  position_id: string;
  user_id: string;
  ticker: string;
  exchange_id: number;
  total_shares: number;
  average_cost: number;
  current_market_price?: number;
  current_value?: number;
  unrealized_pnl?: number;
  realized_pnl: number;
  is_active: boolean;
  opened_date?: string;
  closed_date?: string;
  strategy_id?: number;
  position_currency: string;
}

/**
 * Update or create position (for LONG_TERM strategy)
 * Aggregates shares and calculates weighted average cost
 */
export async function aggregateToPosition(transaction: {
  user_id: string;
  ticker: string;
  exchange_id: number;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
  transaction_currency: string;
}) {
  const supabase = await createClient();

  // Check for existing active position
  const { data: existingPosition, error: fetchError } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('ticker', transaction.ticker)
    .eq('exchange_id', transaction.exchange_id)
    .eq('is_active', true)
    .eq('strategy_id', transaction.strategy_id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch position: ${fetchError.message}`);
  }

  if (existingPosition) {
    // Update existing position with new weighted average cost
    const newTotalShares = parseFloat(existingPosition.total_shares) + transaction.quantity;
    const newAverageCost =
      (parseFloat(existingPosition.average_cost) * parseFloat(existingPosition.total_shares) +
        transaction.price * transaction.quantity) /
      newTotalShares;

    const { data, error } = await supabase
      .from('positions')
      .update({
        total_shares: newTotalShares,
        average_cost: newAverageCost,
        updated_at: new Date().toISOString()
      })
      .eq('position_id', existingPosition.position_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update position: ${error.message}`);
    }

    return data;
  } else {
    // Create new position
    const { data, error } = await supabase
      .from('positions')
      .insert({
        user_id: transaction.user_id,
        ticker: transaction.ticker,
        exchange_id: transaction.exchange_id,
        total_shares: transaction.quantity,
        average_cost: transaction.price,
        strategy_id: transaction.strategy_id,
        opened_date: transaction.transaction_date,
        position_currency: transaction.transaction_currency,
        is_active: true,
        realized_pnl: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create position: ${error.message}`);
    }

    return data;
  }
}

/**
 * Reduce position when selling from LONG_TERM holdings
 */
export async function reducePosition(transaction: {
  user_id: string;
  ticker: string;
  exchange_id: number;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
}) {
  const supabase = await createClient();

  // Get active position
  const { data: position, error: fetchError } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', transaction.user_id)
    .eq('ticker', transaction.ticker)
    .eq('exchange_id', transaction.exchange_id)
    .eq('is_active', true)
    .eq('strategy_id', transaction.strategy_id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch position: ${fetchError.message}`);
  }

  const newTotalShares = parseFloat(position.total_shares) - transaction.quantity;

  // Calculate realized P&L for this sale
  const costBasis = parseFloat(position.average_cost) * transaction.quantity;
  const saleProceeds = transaction.price * transaction.quantity;
  const realizedPnlFromSale = saleProceeds - costBasis;
  const totalRealizedPnl = parseFloat(position.realized_pnl || '0') + realizedPnlFromSale;

  if (newTotalShares <= 0) {
    // Position fully closed
    const { data, error } = await supabase
      .from('positions')
      .update({
        total_shares: 0,
        is_active: false,
        closed_date: transaction.transaction_date,
        realized_pnl: totalRealizedPnl,
        updated_at: new Date().toISOString()
      })
      .eq('position_id', position.position_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to close position: ${error.message}`);
    }

    return data;
  } else {
    // Partial sell
    const { data, error } = await supabase
      .from('positions')
      .update({
        total_shares: newTotalShares,
        realized_pnl: totalRealizedPnl,
        updated_at: new Date().toISOString()
      })
      .eq('position_id', position.position_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reduce position: ${error.message}`);
    }

    return data;
  }
}

/**
 * Get all active positions for a user
 */
export async function getActivePositions(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('positions')
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
    .eq('is_active', true)
    .order('ticker');

  if (error) {
    throw new Error(`Failed to fetch positions: ${error.message}`);
  }

  return data;
}

/**
 * Get position by ticker
 */
export async function getPositionByTicker(
  userId: string,
  ticker: string,
  exchangeId: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .eq('exchange_id', exchangeId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch position: ${error.message}`);
  }

  return data;
}