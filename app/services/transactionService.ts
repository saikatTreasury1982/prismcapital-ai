import { createClient } from '@/utils/supabase/server';
import { getAssetClassification } from './assetClassificationService';
import { aggregateToPosition, reducePosition } from './positionService';
import { createTradeLot, closeTradeLot, getOldestOpenLot } from './tradeLotService';
import { CURRENT_USER_ID } from '@/app/lib/auth';

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
  const supabase = await createClient();

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

  // 2. Insert the transaction with strategy_id
  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      ticker: txnData.ticker,
      exchange_id: txnData.exchange_id,
      transaction_type_id: txnData.transaction_type_id,
      transaction_date: txnData.transaction_date,
      quantity: txnData.quantity,
      price: txnData.price,
      total_value: txnData.quantity * txnData.price,
      fees: txnData.fees || 0,
      notes: txnData.notes,
      strategy_id: classification.type_id,
      transaction_currency: txnData.transaction_currency || 'USD'
    })
    .select()
    .single();

  if (txnError) {
    throw new Error(`Failed to create transaction: ${txnError.message}`);
  }

  // 3. Route based on transaction type and strategy
  let message = '';

  if (txnData.transaction_type_id === 1) {
    // BUY TRANSACTION
    if (strategyCode === 'LONG_TERM') {
      // Aggregate to position
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
      message = `Buy transaction recorded and added to long-term position for ${txnData.ticker}`;
    } else {
      // Create new trade lot (DAY_TRADE, SWING_TRADE, POSITION_TRADE)
      await createTradeLot({
        transaction_id: transaction.transaction_id,
        user_id: userId,
        ticker: txnData.ticker,
        exchange_id: txnData.exchange_id,
        transaction_date: txnData.transaction_date,
        price: txnData.price,
        quantity: txnData.quantity,
        fees: txnData.fees || 0,
        strategy_id: classification.type_id,
        transaction_currency: txnData.transaction_currency || 'USD'
      });
      message = `Buy transaction recorded and new ${strategyCode} lot created for ${txnData.ticker}`;
    }
  } else if (txnData.transaction_type_id === 2) {
    // SELL TRANSACTION
    if (strategyCode === 'LONG_TERM') {
      // Reduce from position
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
    } else {
      // Close oldest open lot (FIFO)
      const openLot = await getOldestOpenLot(
        userId,
        txnData.ticker,
        txnData.exchange_id
      );

      if (openLot) {
        await closeTradeLot({
          lot_id: openLot.lot_id,
          exit_transaction_id: transaction.transaction_id,
          exit_date: txnData.transaction_date,
          exit_price: txnData.price,
          exit_fees: txnData.fees || 0,
          exit_currency: txnData.transaction_currency || 'USD'
        });
        message = `Sell transaction recorded and lot closed for ${txnData.ticker}`;
      } else {
        // No open lots found - this might be an error condition
        message = `Sell transaction recorded for ${txnData.ticker} but no open lots found to close`;
      }
    }
  }

  return {
    transaction,
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
  const supabase = await createClient();

  let query = supabase
    .from('transactions')
    .select(`
      *,
      exchanges (
        exchange_code,
        exchange_name
      ),
      transaction_types (
        type_name
      ),
      trade_strategies (
        strategy_code,
        strategy_name
      )
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (filters?.ticker) {
    query = query.eq('ticker', filters.ticker);
  }

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }

  if (filters?.transactionType) {
    query = query.eq('transaction_type_id', filters.transactionType);
  }

  if (filters?.strategyId) {
    query = query.eq('strategy_id', filters.strategyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data;
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(transactionId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      exchanges (
        exchange_code,
        exchange_name
      ),
      transaction_types (
        type_name
      ),
      trade_strategies (
        strategy_code,
        strategy_name
      )
    `)
    .eq('transaction_id', transactionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }

  return data;
}

/**
 * Delete a transaction (soft delete by marking as inactive or hard delete)
 * WARNING: This should also clean up associated positions/lots
 */
export async function deleteTransaction(transactionId: string, userId: string) {
  const supabase = await createClient();

  // Get transaction details first
  const transaction = await getTransactionById(transactionId, userId);

  // Hard delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('transaction_id', transactionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  return { success: true, message: 'Transaction deleted successfully' };
}

/**
 * Get transaction summary/statistics
 */
export async function getTransactionSummary(userId: string, period?: 'day' | 'week' | 'month' | 'year') {
  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_type_id, total_value, fees')
    .eq('user_id', userId)
    .gte('transaction_date', startDate.toISOString().split('T')[0]);

  if (error) {
    throw new Error(`Failed to fetch transaction summary: ${error.message}`);
  }

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
      summary.totalBuyValue += parseFloat(txn.total_value);
    } else if (txn.transaction_type_id === 2) {
      summary.totalSells++;
      summary.totalSellValue += parseFloat(txn.total_value);
    }
    summary.totalFees += parseFloat(txn.fees || '0');
  });

  return summary;
}