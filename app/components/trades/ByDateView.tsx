'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Transaction } from '../../lib/types/transaction';
import { getTransactions } from '../../services/transactionServiceClient';
import { TransactionDetailModal } from './TransactionDetailModal';

interface ByDateViewProps {
  onEdit?: (transaction: Transaction) => void;
  onDelete?: () => void;
}

export function ByDateView({ onEdit, onDelete }: ByDateViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter states
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    transactionType: 'all' // 'all', '1' (Buy), '2' (Sell)
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by date range
    if (filters.fromDate) {
      filtered = filtered.filter(t => t.transaction_date >= filters.fromDate);
    }
    if (filters.toDate) {
      filtered = filtered.filter(t => t.transaction_date <= filters.toDate);
    }

    // Filter by transaction type
    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type_id === parseInt(filters.transactionType));
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, transactions]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate summary stats
  const stats = filteredTransactions.reduce((acc, t) => {
    acc.totalTransactions += 1;
    acc.totalValue += t.trade_value;
    acc.totalFees += t.fees;
    if (t.transaction_type_id === 1) {
      acc.buyCount += 1;
      acc.buyValue += t.trade_value;
    } else {
      acc.sellCount += 1;
      acc.sellValue += t.trade_value;
    }
    return acc;
  }, {
    totalTransactions: 0,
    totalValue: 0,
    totalFees: 0,
    buyCount: 0,
    buyValue: 0,
    sellCount: 0,
    sellValue: 0
  });

  const handleDeleteComplete = async () => {
    if (onDelete) {
      onDelete();
    }
    // Refresh transactions
    const data = await getTransactions();
    setTransactions(data);
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Filter Transactions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* From Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Type</label>
            <select
              value={filters.transactionType}
              onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            >
              <option value="all" className="bg-slate-800 text-white">All</option>
              <option value="1" className="bg-slate-800 text-white">Buy</option>
              <option value="2" className="bg-slate-800 text-white">Sell</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.fromDate || filters.toDate || filters.transactionType !== 'all') && (
          <button
            onClick={() => setFilters({ fromDate: '', toDate: '', transactionType: 'all' })}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
          <p className="text-blue-300 text-sm mb-1">Total Transactions</p>
          <p className="text-white text-3xl font-bold">{stats.totalTransactions}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
          <p className="text-green-300 text-sm mb-1">Buy Transactions</p>
          <p className="text-white text-2xl font-bold">{stats.buyCount}</p>
          <p className="text-green-200 text-sm">${stats.buyValue.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-2xl p-6 border border-rose-400/20">
          <p className="text-rose-300 text-sm mb-1">Sell Transactions</p>
          <p className="text-white text-2xl font-bold">{stats.sellCount}</p>
          <p className="text-rose-200 text-sm">${stats.sellValue.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
          <p className="text-purple-300 text-sm mb-1">Total Fees</p>
          <p className="text-white text-3xl font-bold">${stats.totalFees.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-200">
              No transactions found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-blue-300 p-4">Date</th>
                    <th className="text-left text-blue-300 p-4">Ticker</th>
                    <th className="text-center text-blue-300 p-4">Type</th>
                    <th className="text-right text-blue-300 p-4">Quantity</th>
                    <th className="text-right text-blue-300 p-4">Price</th>
                    <th className="text-right text-blue-300 p-4">Fees</th>
                    <th className="text-right text-blue-300 p-4">Trade Value</th>
                    <th className="text-left text-blue-300 p-4">Notes</th>
                    <th className="text-center text-blue-300 p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-white font-semibold">{transaction.ticker}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.transaction_type_id === 1 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="p-4 text-right text-white">{transaction.quantity.toLocaleString()}</td>
                      <td className="p-4 text-right text-white">${transaction.price.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${transaction.fees.toFixed(2)}</td>
                      <td className="p-4 text-right text-white font-semibold">
                        ${transaction.trade_value.toFixed(2)}
                      </td>
                      <td className="p-4 text-white text-xs truncate max-w-[150px]">
                        {transaction.notes || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-400 hover:text-blue-300 text-xs underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-blue-200 text-sm">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={(transaction) => {
          if (onEdit) {
            onEdit(transaction);
          }
          setSelectedTransaction(null);
        }}
        onDelete={handleDeleteComplete}
      />
    </div>
  );
}