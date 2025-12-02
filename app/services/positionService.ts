import { db, schema } from '../lib/db';
import { eq, and } from 'drizzle-orm';
import {fetchCurrentPrice} from '@/app/lib/priceService';

const { positions, realizedPnlHistory } = schema;

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
  is_active: boolean;
  opened_date?: string;
  closed_date?: string;
  strategy_id?: number;
  position_currency: string;
}

/**
 * Transaction-aware version: Update or create position (for LONG_TERM strategy)
 * Used inside db.transaction() wrapper
 */
export async function aggregateToPositionTx(tx: any, transaction: {
  user_id: string;
  ticker: string;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
  transaction_currency: string;
  ticker_name: string;
}) {
  // Check for existing active position (using only user_id + ticker)
  const existingPosition = await tx
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.user_id, transaction.user_id),
        eq(positions.ticker, transaction.ticker),
        eq(positions.is_active, 1),
        eq(positions.strategy_id, transaction.strategy_id)
      )
    )
    .limit(1);

  if (existingPosition && existingPosition.length > 0) {
    const pos = existingPosition[0];
    const newTotalShares = (pos.total_shares || 0) + transaction.quantity;
    const newAverageCost = ((pos.average_cost || 0) * (pos.total_shares || 0) + transaction.price * transaction.quantity) / newTotalShares;

    await tx
      .update(positions)
      .set({
        total_shares: parseFloat(newTotalShares.toFixed(3)),
        average_cost: parseFloat(newAverageCost.toFixed(3)),
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  } else {
    // Fetch current market price before inserting
    const currentMarketPrice = await fetchCurrentPrice(transaction.ticker);

    const result = await tx.insert(positions).values({
      user_id: transaction.user_id,
      ticker: transaction.ticker,
      total_shares: transaction.quantity,
      average_cost: transaction.price,
      current_market_price: currentMarketPrice,  // ← ADD THIS
      strategy_id: transaction.strategy_id,
      opened_date: transaction.transaction_date,
      position_currency: transaction.transaction_currency,
      ticker_name: transaction.ticker_name,
      is_active: 1,
      realized_pnl: 0,
    }).returning();

    return result[0];
  }
}

/**
 * Transaction-aware version: Reduce position when selling
 * Used inside db.transaction() wrapper
 */
export async function reducePositionTx(tx: any, transaction: {
  user_id: string;
  ticker: string;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
}) {
  const existingPosition = await tx
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.user_id, transaction.user_id),
        eq(positions.ticker, transaction.ticker),
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

  // Insert into realized_pnl_history with correct schema
  await tx.insert(realizedPnlHistory).values({
    user_id: transaction.user_id,
    position_id: pos.position_id,
    ticker: transaction.ticker,
    sale_date: transaction.transaction_date,
    quantity: parseFloat(transaction.quantity.toFixed(3)),
    average_cost: parseFloat(pos.average_cost.toFixed(3)),
    total_cost: parseFloat(costBasis.toFixed(3)),
    sale_price: parseFloat(transaction.price.toFixed(3)),
    total_proceeds: parseFloat(saleProceeds.toFixed(3)),
    realized_pnl: parseFloat(realizedPnlFromSale.toFixed(3)),
    entry_date: pos.opened_date || null,
    position_currency: pos.position_currency || 'USD',
    fees: 0,
    notes: null,
  });

  if (newTotalShares === 0) {
    await tx
      .update(positions)
      .set({
        total_shares: 0,
        is_active: 0,
        realized_pnl: parseFloat(totalRealizedPnl.toFixed(3)),
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  } else {
    await tx
      .update(positions)
      .set({
        total_shares: newTotalShares,
        realized_pnl: parseFloat(totalRealizedPnl.toFixed(3)),
        updated_at: new Date().toISOString(),
      })
      .where(eq(positions.position_id, pos.position_id));

    return pos;
  }
}

/**
 * Legacy non-transaction version: Update or create position
 * Kept for backward compatibility with existing code
 */
export async function aggregateToPosition(transaction: {
  user_id: string;
  ticker: string;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
  transaction_currency: string;
  ticker_name: string;
}) {
  return await aggregateToPositionTx(db, transaction);
}

/**
 * Legacy non-transaction version: Reduce position
 * Kept for backward compatibility with existing code
 */
export async function reducePosition(transaction: {
  user_id: string;
  ticker: string;
  quantity: number;
  price: number;
  transaction_date: string;
  strategy_id: number;
}) {
  return await reducePositionTx(db, transaction);
}