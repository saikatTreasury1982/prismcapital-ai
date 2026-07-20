'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
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
      <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Transactions
        </h2>
        <p className="text-blue-200 text-center py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Transactions
      </h2>
      <p className="text-xs text-blue-300 mt-1 mb-3">
        Showing {transactions.length} most recent transaction{transactions.length !== 1 ? 's' : ''}
      </p>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-blue-200 text-sm">No transactions yet</p>
          <p className="text-blue-300 text-xs mt-1">Your recent transactions will appear here</p>
        </div>
      ) : (
        <div>
          {transactions.map((transaction, idx) => {
            const isBuy = transaction.transaction_type_id === 1;
            const amount = (transaction.trade_value || transaction.quantity * transaction.price);
            return (
              <div
                key={transaction.transaction_id}
                className={`flex items-center justify-between py-2.5 border-t border-white/10 ${
                  idx === transactions.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-semibold text-sm">{transaction.ticker}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      isBuy ? 'bg-green-500/20 text-green-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isBuy ? 'BUY' : 'SELL'}
                  </span>
                </div>

                <div className="text-right min-w-0">
                  <div className={`font-semibold text-sm ${isBuy ? 'text-green-400' : 'text-rose-400'}`}>
                    {isBuy ? '+' : '\u2212'}${amount.toFixed(2)}
                    <span className="text-blue-300 text-[10px] font-normal ml-1">
                      {transaction.transaction_currency}
                    </span>
                  </div>
                  <div className="text-blue-300 text-[11px]">
                    {transaction.quantity} @ ${transaction.price.toFixed(2)} ·{' '}
                    {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}