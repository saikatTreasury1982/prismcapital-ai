/*
import { db, schema } from '../lib/db';
import { eq, and, gte, lte, asc, desc } from 'drizzle-orm';

const { tradeLots, tradeStrategies, transactions } = schema;

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

// Create new trade lot (for DAY_TRADE, SWING_TRADE, POSITION_TRADE)
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
  // Get strategy code for trade_type
  const strategy = await db
    .select()
    .from(tradeStrategies)
    .where(eq(tradeStrategies.strategy_id, transaction.strategy_id))
    .limit(1);

  const lotId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const data = await db
    .insert(tradeLots)
    .values({
      lot_id: lotId,
      user_id: transaction.user_id,
      ticker: transaction.ticker,
      exchange_id: transaction.exchange_id,
      entry_date: transaction.transaction_date,
      entry_price: transaction.price,
      quantity: transaction.quantity,
      entry_fees: transaction.fees || 0,
      entry_transaction_id: transaction.transaction_id,
      trade_strategy: transaction.strategy_id,
      lot_status: 'OPEN',
      trade_currency: transaction.transaction_currency,
    })
    .returning();

  return data[0];
}

// Close trade lot when selling
export async function closeTradeLot(closeData: {
  lot_id: string;
  exit_transaction_id: string;
  exit_date: string;
  exit_price: number;
  exit_fees: number;
  exit_currency: string;
}) {
  // Get lot details
  const lot = await db
    .select()
    .from(tradeLots)
    .where(eq(tradeLots.lot_id, closeData.lot_id))
    .limit(1);

  if (!lot || lot.length === 0) {
    throw new Error('Lot not found');
  }

  const lotData = lot[0];

  // Calculate P&L
  const totalEntry = (lotData.entry_price || 0) * (lotData.quantity || 0) + (lotData.entry_fees || 0);
  const totalExit = closeData.exit_price * (lotData.quantity || 0) - closeData.exit_fees;
  const realizedPnl = totalExit - totalEntry;
  const realizedPnlPct = (realizedPnl / totalEntry) * 100;

  // Calculate holding days
  const entryDate = new Date(lotData.entry_date || '');
  const exitDate = new Date(closeData.exit_date);
  const holdingDays = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

  const data = await db
    .update(tradeLots)
    .set({
      exit_date: closeData.exit_date,
      exit_price: closeData.exit_price,
      exit_fees: closeData.exit_fees,
      exit_transaction_id: closeData.exit_transaction_id,
      realized_pnl: realizedPnl,
      realized_pnl_percent: realizedPnlPct,
      trade_hold_days: holdingDays,
      lot_status: 'CLOSED',
      updated_at: new Date().toISOString(),
    })
    .where(eq(tradeLots.lot_id, closeData.lot_id))
    .returning();

  return data[0];
}

// Get oldest open lot for a ticker (FIFO)
export async function getOldestOpenLot(
  userId: string,
  ticker: string,
  exchangeId: number
) {
  const data = await db
    .select()
    .from(tradeLots)
    .where(
      and(
        eq(tradeLots.user_id, userId),
        eq(tradeLots.ticker, ticker),
        eq(tradeLots.exchange_id, exchangeId),
        eq(tradeLots.lot_status, 'OPEN')
      )
    )
    .orderBy(asc(tradeLots.entry_date))
    .limit(1);

  return data.length > 0 ? data[0] : null;
}

// Get all open lots for a user
export async function getOpenLots(userId: string, ticker?: string) {
  const conditions = ticker
    ? and(
        eq(tradeLots.user_id, userId),
        eq(tradeLots.lot_status, 'OPEN'),
        eq(tradeLots.ticker, ticker)
      )
    : and(
        eq(tradeLots.user_id, userId),
        eq(tradeLots.lot_status, 'OPEN')
      );

  const data = await db
    .select()
    .from(tradeLots)
    .where(conditions)
    .orderBy(desc(tradeLots.entry_date));

  return data;
}

// Get all closed lots for a user with optional filters
export async function getClosedLots(
  userId: string,
  filters?: {
    ticker?: string;
    strategyCode?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const conditions = [
    eq(tradeLots.user_id, userId),
    eq(tradeLots.lot_status, 'CLOSED')
  ];

  if (filters?.ticker) {
    conditions.push(eq(tradeLots.ticker, filters.ticker));
  }

  if (filters?.strategyCode) {
    conditions.push(eq(tradeLots.trade_type, filters.strategyCode));
  }

  if (filters?.startDate) {
    conditions.push(gte(tradeLots.exit_date, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(tradeLots.exit_date, filters.endDate));
  }

  const data = await db
    .select()
    .from(tradeLots)
    .where(and(...conditions))
    .orderBy(desc(tradeLots.exit_date));

  return data;
}

// Convert trade lot to long-term position
export async function convertLotToLongTerm(lotId: string) {
  // Get lot details
  const lot = await db
    .select()
    .from(tradeLots)
    .where(eq(tradeLots.lot_id, lotId))
    .limit(1);

  if (!lot || lot.length === 0) {
    throw new Error('Lot not found');
  }

  const lotData = lot[0];

  // Get LONG_TERM strategy ID
  const longTermStrategy = await db
    .select()
    .from(tradeStrategies)
    .where(eq(tradeStrategies.strategy_code, 'LONG_TERM'))
    .limit(1);

  if (!longTermStrategy || longTermStrategy.length === 0) {
    throw new Error('LONG_TERM strategy not found');
  }

  // 1. Update lot status
  await db
    .update(tradeLots)
    .set({
      lot_status: 'CONVERTED_TO_LONG_TERM',
      updated_at: new Date().toISOString(),
    })
    .where(eq(tradeLots.lot_id, lotId));

  // 2. Update original transaction's strategy
  await db
    .update(transactions)
    .set({
      trade_strategy: longTermStrategy[0].strategy_id,
      trade_lot_id: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(transactions.transaction_id, lotData.entry_transaction_id || ''));

  // 3. Aggregate to position
  const { aggregateToPosition } = await import('./positionService');
  
  await aggregateToPosition({
    user_id: lotData.user_id,
    ticker: lotData.ticker,
    exchange_id: lotData.exchange_id,
    quantity: lotData.quantity || 0,
    price: lotData.entry_price || 0,
    transaction_date: lotData.entry_date || '',
    strategy_id: longTermStrategy[0].strategy_id,
    transaction_currency: lotData.trade_currency || 'USD'
  });

  return { success: true, message: 'Lot converted to long-term position' };
}

*/