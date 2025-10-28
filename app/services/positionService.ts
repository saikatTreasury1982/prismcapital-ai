
import { db, schema } from '../lib/db';
import { eq, and } from 'drizzle-orm';

const { positions } = schema;

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
  // Check for existing active position
  const existingPosition = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.user_id, transaction.user_id),
        eq(positions.ticker, transaction.ticker),
        eq(positions.exchange_id, transaction.exchange_id),
        eq(positions.is_active, 1),
        eq(positions.strategy_id, transaction.strategy_id)
      )
    )
    .limit(1);

  if (existingPosition && existingPosition.length > 0) {
    const pos = existingPosition[0];
    const newTotalShares = (pos.total_shares || 0) + transaction.quantity;
    const newAverageCost = ((pos.average_cost || 0) * (pos.total_shares || 0) + transaction.price * transaction.quantity) / newTotalShares;

    await db
      .update(positions)
      .set({
        total_shares: newTotalShares,
        average_cost: newAverageCost,
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  } else {
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(positions).values({
      position_id: positionId,
      user_id: transaction.user_id,
      ticker: transaction.ticker,
      exchange_id: transaction.exchange_id,
      total_shares: transaction.quantity,
      average_cost: transaction.price,
      strategy_id: transaction.strategy_id,
      opened_date: transaction.transaction_date,
      position_currency: transaction.transaction_currency,
      is_active: 1,
      realized_pnl: 0,
    });

    return { position_id: positionId };
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
  const existingPosition = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.user_id, transaction.user_id),
        eq(positions.ticker, transaction.ticker),
        eq(positions.exchange_id, transaction.exchange_id),
        eq(positions.is_active, 1),
        eq(positions.strategy_id, transaction.strategy_id)
      )
    )
    .limit(1);

  if (!existingPosition || existingPosition.length === 0) {
    throw new Error('No active position found');
  }

  const pos = existingPosition[0];
  const newTotalShares = (pos.total_shares || 0) - transaction.quantity;

  if (newTotalShares < 0) {
    throw new Error(`Insufficient shares. Available: ${pos.total_shares}, Trying to sell: ${transaction.quantity}`);
  }

  const costBasis = pos.average_cost * transaction.quantity;
  const saleProceeds = transaction.price * transaction.quantity;
  const realizedPnlFromSale = saleProceeds - costBasis;
  const totalRealizedPnl = (pos.realized_pnl || 0) + realizedPnlFromSale;

  if (newTotalShares === 0) {
    await db
      .update(positions)
      .set({
        total_shares: 0,
        is_active: 0,
        realized_pnl: totalRealizedPnl,
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  } else {
    await db
      .update(positions)
      .set({
        total_shares: newTotalShares,
        realized_pnl: totalRealizedPnl,
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  }
}

/**
 * Get all active positions for a user

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
*/

/**
 * Get position by ticker

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
*/