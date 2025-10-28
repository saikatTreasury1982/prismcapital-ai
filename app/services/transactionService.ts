
import { db, schema } from '../lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getAssetClassification } from './assetClassificationService';
import { aggregateToPosition, reducePosition } from './positionService';
// import { createTradeLot, closeTradeLot, getOldestOpenLot } from './tradeLotService'; // NOT USED - Strategy 1 (aggregate) only

const { transactions, exchanges, transactionTypes, tradeStrategies } = schema;


export interface TransactionInput {
  ticker: string;
  exchange_id: number;
  transaction_type_id: number; // 1 = BUY, 2 = SELL
  transaction_date: string;
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
  transaction_currency?: string;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  ticker: string;
  exchange_id: number;
  transaction_type_id: number;
  transaction_date: string;
  quantity: number;
  price: number;
  total_value: number;
  fees: number;
  notes?: string;
  trade_lot_id?: string;
  strategy_id?: number;
  transaction_currency: string;
  created_at: string;
  updated_at: string;
}

/**
 * Main function to record a transaction
 * Automatically routes to position or trade lot based on asset classification
 */
export async function recordTransaction(
  userId: string,
  txnData: TransactionInput
): Promise<{ transaction: Transaction; message: string }> {
  // 1. Get asset classification for this ticker
  const classificationResult = await getAssetClassification(
    txnData.ticker,
    txnData.exchange_id,
    userId
  );

  if (!classificationResult) {
    throw new Error(
      `No asset classification found for ${txnData.ticker}. Please classify this asset first in Settings.`
    );
  }

  const { classification, strategyCode } = classificationResult;

  // 2. Insert the transaction
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const transactionData = await db
    .insert(transactions)
    .values({
      transaction_id: transactionId,
      user_id: userId,
      ticker: txnData.ticker,
      exchange_id: txnData.exchange_id,
      transaction_type_id: txnData.transaction_type_id,
      transaction_date: txnData.transaction_date,
      quantity: txnData.quantity,
      price: txnData.price,
      trade_value: txnData.quantity * txnData.price,
      fees: txnData.fees || 0,
      notes: txnData.notes || null,
      transaction_currency: txnData.transaction_currency || 'USD'
    })
    .returning();

  const transaction = transactionData[0];
  let message = '';

  // 3. Route based on transaction type (AGGREGATED STRATEGY ONLY)
  if (strategyCode === 'LONG_TERM' || strategyCode === 'AGGREGATED') {
    if (txnData.transaction_type_id === 1) {
      // BUY - Aggregate to position
      await aggregateToPosition({
        user_id: userId,
        ticker: txnData.ticker,
        exchange_id: txnData.exchange_id,
        quantity: txnData.quantity,
        price: txnData.price,
        transaction_date: txnData.transaction_date,
        strategy_id: classification.type_id,
        transaction_currency: txnData.transaction_currency || 'USD'
      });
      message = `Buy transaction recorded and added to position for ${txnData.ticker}`;
    } else if (txnData.transaction_type_id === 2) {
      // SELL - Reduce position
      await reducePosition({
        user_id: userId,
        ticker: txnData.ticker,
        exchange_id: txnData.exchange_id,
        quantity: txnData.quantity,
        price: txnData.price,
        transaction_date: txnData.transaction_date,
        strategy_id: classification.type_id
      });
      message = `Sell transaction recorded and position reduced for ${txnData.ticker}`;
    }
  } else {
    // Trade lot strategies not implemented yet
    message = `Transaction recorded for ${txnData.ticker} (lot-based tracking not yet implemented)`;
  }

  return {
    transaction: transaction as any,
    message
  };
}

/**
 * Get all transactions for a user with optional filters
 */
export async function getTransactions(
  userId: string,
  filters?: {
    ticker?: string;
    startDate?: string;
    endDate?: string;
    transactionType?: number;
    strategyId?: number;
  }
) {
  const conditions = [eq(transactions.user_id, userId)];

  if (filters?.ticker) {
    conditions.push(eq(transactions.ticker, filters.ticker));
  }

  if (filters?.startDate) {
    conditions.push(gte(transactions.transaction_date, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(transactions.transaction_date, filters.endDate));
  }

  if (filters?.transactionType) {
    conditions.push(eq(transactions.transaction_type_id, filters.transactionType));
  }

  const data = await db
    .select({
      transaction: transactions,
      exchange: exchanges,
      transactionType: transactionTypes,
      strategy: tradeStrategies,
    })
    .from(transactions)
    .leftJoin(exchanges, eq(transactions.exchange_id, exchanges.exchange_id))
    .leftJoin(transactionTypes, eq(transactions.transaction_type_id, transactionTypes.type_id))
    .where(and(...conditions))
    .orderBy(desc(transactions.transaction_date));

  return data.map(d => ({
    ...d.transaction,
    exchanges: d.exchange,
    transaction_types: d.transactionType,
    trade_strategies: d.strategy,
  }));
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(transactionId: string, userId: string) {
  const data = await db
    .select({
      transaction: transactions,
      exchange: exchanges,
      transactionType: transactionTypes,
      strategy: tradeStrategies,
    })
    .from(transactions)
    .leftJoin(exchanges, eq(transactions.exchange_id, exchanges.exchange_id))
    .leftJoin(transactionTypes, eq(transactions.transaction_type_id, transactionTypes.type_id))
    .where(
      and(
        eq(transactions.transaction_id, transactionId),
        eq(transactions.user_id, userId)
      )
    )
    .limit(1);

  if (!data || data.length === 0) {
    throw new Error('Transaction not found');
  }

  return {
    ...data[0].transaction,
    exchanges: data[0].exchange,
    transaction_types: data[0].transactionType,
    trade_strategies: data[0].strategy,
  };
}

/**
 * Delete a transaction (soft delete by marking as inactive or hard delete)
 * WARNING: This should also clean up associated positions/lots
 */
export async function deleteTransaction(transactionId: string, userId: string) {
  // TODO: Add logic to reverse position changes before deleting
  
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.transaction_id, transactionId),
        eq(transactions.user_id, userId)
      )
    );

  return { success: true, message: 'Transaction deleted successfully' };
}

/**
 * Get transaction summary/statistics
 */
export async function getTransactionSummary(userId: string, period?: 'day' | 'week' | 'month' | 'year') {
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const data = await db
    .select({
      transaction_type_id: transactions.transaction_type_id,
      total_value: transactions.trade_value,
      fees: transactions.fees,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.user_id, userId),
        gte(transactions.transaction_date, startDate.toISOString().split('T')[0])
      )
    );

  const summary = {
    totalBuys: 0,
    totalSells: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    totalFees: 0,
    transactionCount: data.length
  };

  data.forEach(txn => {
    if (txn.transaction_type_id === 1) {
      summary.totalBuys++;
      summary.totalBuyValue += txn.total_value || 0;
    } else if (txn.transaction_type_id === 2) {
      summary.totalSells++;
      summary.totalSellValue += txn.total_value || 0;
    }
    summary.totalFees += txn.fees || 0;
  });

  return summary;
}