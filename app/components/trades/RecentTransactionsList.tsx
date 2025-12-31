'use client';

import { useEffect, useState } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '../../lib/types/transaction';
import { getTransactions } from '../../services/transactionServiceClient';

interface RecentTransactionsListProps {
  refreshKey?: number;
}

export function RecentTransactionsList({ refreshKey = 0 }: RecentTransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await getTransactions();
        // Get only the 5 most recent
        setTransactions(data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch recent transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6" />
          Recent Transactions
        </h2>
        <p className="text-blue-200 text-center py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6" />
          Recent Transactions
        </h2>
        <p className="text-xs text-blue-300 mt-3">Showing {transactions.length} most recent transaction{transactions.length !== 1 ? 's' : ''}</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-blue-200 text-sm">No transactions yet</p>
          <p className="text-blue-300 text-xs mt-2">Your recent transactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.transaction_id}
              className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">{transaction.ticker}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    transaction.transaction_type_id === 1 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    transaction.transaction_type_id === 1 ? 'text-green-400' : 'text-rose-400'
                  }`}>
                    {transaction.transaction_type_id === 1 ? '+' : '-'}${(transaction.trade_value || (transaction.quantity * transaction.price)).toFixed(2)}
                  </div>
                  <div className="text-blue-300 text-xs">
                    {transaction.transaction_currency}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-blue-200">
                  {transaction.quantity} shares @ ${transaction.price.toFixed(2)}
                </div>
                <div className="text-blue-300 text-xs">
                  {new Date(transaction.transaction_date).toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}