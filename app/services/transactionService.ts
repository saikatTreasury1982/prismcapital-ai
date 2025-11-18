import { db, schema } from '../lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const { transactions, transactionTypes, tradeStrategies } = schema;

export interface TransactionInput {
  ticker: string;
  transaction_type_id: number; // 1 = BUY, 2 = SELL
  transaction_date: string;
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
  transaction_currency?: string;
  strategy_id?: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  ticker: string;
  transaction_type_id: number;
  transaction_date: string;
  quantity: number;
  price: number;
  trade_value: number;
  fees: number;
  notes?: string;
  trade_lot_id?: string;
  transaction_currency: string;
  created_at: string;
  updated_at: string;
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
      transactionType: transactionTypes,
      strategy: tradeStrategies,
    })
    .from(transactions)
    .leftJoin(transactionTypes, eq(transactions.transaction_type_id, transactionTypes.type_id))
    .where(and(...conditions))
    .orderBy(desc(transactions.transaction_date));

  return data.map(d => ({
    ...d.transaction,
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
      transactionType: transactionTypes,
      strategy: tradeStrategies,
    })
    .from(transactions)
    .leftJoin(transactionTypes, eq(transactions.transaction_type_id, transactionTypes.type_id))
    .where(
      and(
        eq(transactions.transaction_id, parseInt(transactionId)), // ✅ Parse to number
        eq(transactions.user_id, userId)
      )
    )
    .limit(1);

  if (!data || data.length === 0) {
    throw new Error('Transaction not found');
  }

  return {
    ...data[0].transaction,
    transaction_types: data[0].transactionType,
    trade_strategies: data[0].strategy,
  };
}

/**
 * Delete a transaction
 * WARNING: This should also reverse position changes before deleting
 */
export async function deleteTransaction(transactionId: string, userId: string) {
  // TODO: Add logic to reverse position changes before deleting
  
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.transaction_id, parseInt(transactionId)), // ✅ Parse to number
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