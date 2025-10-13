'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { Position, Transaction, TradeLot } from '../../lib/types/transaction';
import { getPositions } from '../../services/positionServiceClient';
import { getTradeLots } from '../../services/tradeLotServiceClient';
import { getTransactions } from '../../services/transactionServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';
import { TransactionDetailModal } from './TransactionDetailModal';

interface ByTickerViewProps {
  onEdit?: (transaction: Transaction) => void;
  onDelete?: () => void;
}

export function ByTickerView({ onEdit, onDelete }: ByTickerViewProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerLots, setTickerLots] = useState<Record<string, TradeLot[]>>({});
  const [tickerTransactions, setTickerTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await getPositions(CURRENT_USER_ID, true); // Only active positions
        setPositions(data);
      } catch (err) {
        console.error('Failed to fetch positions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleToggleExpand = async (ticker: string) => {
    if (expandedTicker === ticker) {
      setExpandedTicker(null);
      return;
    }

    setExpandedTicker(ticker);

    // Fetch lots and transactions for this ticker if not already loaded
    if (!tickerLots[ticker]) {
      try {
        const lots = await getTradeLots(CURRENT_USER_ID, ticker);
        setTickerLots(prev => ({ ...prev, [ticker]: lots }));
      } catch (err) {
        console.error('Failed to fetch trade lots:', err);
      }
    }

    if (!tickerTransactions[ticker]) {
      try {
        const transactions = await getTransactions(CURRENT_USER_ID, ticker);
        setTickerTransactions(prev => ({ ...prev, [ticker]: transactions }));
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    }
  };

  const getStrategyName = (strategyId: number | null) => {
    if (strategyId === 1) return 'Day Trade';
    if (strategyId === 2) return 'Swing Trade';
    if (strategyId === 3) return 'Position Trade';
    return '-';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'OPEN': 'bg-green-500/20 text-green-300 border-green-400/30',
      'PARTIAL': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'CLOSED': 'bg-slate-500/20 text-slate-300 border-slate-400/30'
    };
    return colors[status as keyof typeof colors] || colors.CLOSED;
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading positions...</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">No active positions found. Start by adding some transactions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => (
        <div
          key={position.position_id}
          className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden"
        >
          {/* Position Summary Header */}
          <div
            onClick={() => handleToggleExpand(position.ticker)}
            className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">{position.ticker}</h3>
                  {position.ticker_name && (
                    <span className="text-blue-200 text-sm">{position.ticker_name}</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-300">Shares</p>
                    <p className="text-white font-semibold">{position.total_shares.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-300">Avg Cost</p>
                    <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-300">Current Value</p>
                    <p className="text-white font-semibold">
                      ${position.current_value ? position.current_value.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Total P/L</p>
                    <p className={`font-semibold flex items-center gap-1 ${
                      (position.unrealized_pnl || 0) + position.realized_pnl >= 0 ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      {(position.unrealized_pnl || 0) + position.realized_pnl >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      ${((position.unrealized_pnl || 0) + position.realized_pnl).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-blue-300">Unrealized P/L</p>
                    <p className={`font-semibold ${
                      (position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      ${position.unrealized_pnl ? position.unrealized_pnl.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Realized P/L</p>
                    <p className={`font-semibold ${
                      position.realized_pnl >= 0 ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      ${position.realized_pnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Current Price</p>
                    <p className="text-white font-semibold">
                      ${position.current_market_price ? position.current_market_price.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-300">Opened</p>
                    <p className="text-white font-semibold">
                      {new Date(position.opened_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {expandedTicker === position.ticker ? (
                  <ChevronUp className="w-6 h-6 text-blue-300" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-blue-300" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded Content: Trade Lots and Transactions */}
          {expandedTicker === position.ticker && (
            <div className="border-t border-white/20 p-6 space-y-6">
              {/* Trade Lots Section */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Trade Lots</h4>
                {tickerLots[position.ticker] && tickerLots[position.ticker].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-blue-300 pb-2">Entry Date</th>
                          <th className="text-left text-blue-300 pb-2">Exit Date</th>
                          <th className="text-right text-blue-300 pb-2">Qty</th>
                          <th className="text-right text-blue-300 pb-2">Entry Price</th>
                          <th className="text-right text-blue-300 pb-2">Exit Price</th>
                          <th className="text-right text-blue-300 pb-2">P/L</th>
                          <th className="text-right text-blue-300 pb-2">P/L %</th>
                          <th className="text-center text-blue-300 pb-2">Hold Days</th>
                          <th className="text-center text-blue-300 pb-2">Strategy</th>
                          <th className="text-center text-blue-300 pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickerLots[position.ticker].map((lot) => (
                          <tr key={lot.lot_id} className="border-b border-white/5">
                            <td className="py-3 text-white">
                              {new Date(lot.entry_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-white">
                              {lot.exit_date ? new Date(lot.exit_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 text-right text-white">{lot.quantity}</td>
                            <td className="py-3 text-right text-white">${lot.entry_price.toFixed(2)}</td>
                            <td className="py-3 text-right text-white">
                              {lot.exit_price ? `$${lot.exit_price.toFixed(2)}` : '-'}
                            </td>
                            <td className={`py-3 text-right font-semibold ${
                              (lot.realized_pl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                            }`}>
                              {lot.realized_pl ? `$${lot.realized_pl.toFixed(2)}` : '-'}
                            </td>
                            <td className={`py-3 text-right font-semibold ${
                              (lot.realized_pl_percent || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                            }`}>
                              {lot.realized_pl_percent ? `${lot.realized_pl_percent.toFixed(2)}%` : '-'}
                            </td>
                            <td className="py-3 text-center text-white">
                              {lot.trade_hold_days || '-'}
                            </td>
                            <td className="py-3 text-center">
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                {getStrategyName(lot.trade_strategy)}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 border rounded text-xs ${getStatusBadge(lot.lot_status)}`}>
                                {lot.lot_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-blue-200 text-sm">No trade lots found.</p>
                )}
              </div>

              {/* Transaction History Section */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4">Transaction History</h4>
                {tickerTransactions[position.ticker] && tickerTransactions[position.ticker].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-blue-300 pb-2">Date</th>
                          <th className="text-center text-blue-300 pb-2">Type</th>
                          <th className="text-right text-blue-300 pb-2">Quantity</th>
                          <th className="text-right text-blue-300 pb-2">Price</th>
                          <th className="text-right text-blue-300 pb-2">Fees</th>
                          <th className="text-right text-blue-300 pb-2">Trade Value</th>
                          <th className="text-left text-blue-300 pb-2">Notes</th>
                          <th className="text-center text-blue-300 pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickerTransactions[position.ticker].map((transaction) => (
                          <tr key={transaction.transaction_id} className="border-b border-white/5">
                            <td className="py-3 text-white">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                transaction.transaction_type_id === 1 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                              </span>
                            </td>
                            <td className="py-3 text-right text-white">{transaction.quantity}</td>
                            <td className="py-3 text-right text-white">${transaction.price.toFixed(2)}</td>
                            <td className="py-3 text-right text-white">${transaction.fees.toFixed(2)}</td>
                            <td className="py-3 text-right text-white">${transaction.trade_value.toFixed(2)}</td>
                            <td className="py-3 text-white text-sm truncate max-w-[150px]">
                              {transaction.notes || '-'}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => setSelectedTransaction(transaction)}
                                className="text-blue-400 hover:text-blue-300 text-xs underline"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-blue-200 text-sm">No transactions found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

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
        onDelete={async (transactionId) => {
          if (onDelete) {
            onDelete();
          }
          setSelectedTransaction(null);
          // Refresh data
          const data = await getPositions(CURRENT_USER_ID, true);
          setPositions(data);
        }}
      />
    </div>
  );
}