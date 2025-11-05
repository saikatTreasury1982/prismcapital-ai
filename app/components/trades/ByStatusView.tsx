'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Tag, RefreshCw } from 'lucide-react';
import { Position, TradeLot, Transaction, AssetClass, AssetType, AssetClassification } from '../../lib/types/transaction';
import { getPositions } from '../../services/positionServiceClient';
import { getTradeLots } from '../../services/tradeLotServiceClient';
import { getTransactions } from '../../services/transactionServiceClient';
import { TransactionDetailModal } from './TransactionDetailModal';
import { AssignAttributesModal } from './AssignAttributesModal';

interface ByStatusViewProps {
  onEdit?: (transaction: Transaction) => void;
  onDelete?: () => void;
}

export function ByStatusView({ onEdit, onDelete }: ByStatusViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'closed'>('open');
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedLots, setClosedLots] = useState<TradeLot[]>([]);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerLots, setTickerLots] = useState<Record<string, TradeLot[]>>({});
  const [tickerTransactions, setTickerTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedPositionForAttributes, setSelectedPositionForAttributes] = useState<Position | null>(null);
  const [transactionPages, setTransactionPages] = useState<Record<string, number>>({});
  const transactionPageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleRefreshPrices = async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshError(null);
    setExpandedTicker(null); // Collapse all

    // Create abort controller to cancel request if component unmounts
    const abortController = new AbortController();

    try {
      const response = await fetch('/api/positions/update-prices', {
        method: 'POST',
        signal: abortController.signal, // Pass abort signal
      });

      if (!response.ok) {
        throw new Error('Failed to update prices');
      }

      const result = await response.json();
      
      // Refresh positions data
      const data = await getPositions(true);
      setPositions(data);

      // Show success message
      console.log(`Updated ${result.updated} of ${result.total} positions`);
      
    } catch (error: any) {
      // Ignore abort errors (these are expected when navigating away)
      if (error.name === 'AbortError') {
        console.log('Price update cancelled');
        return;
      }
      
      console.error('Error refreshing prices:', error);
      setRefreshError(error.message || 'Failed to refresh prices');
    } finally {
      setIsRefreshing(false);
    }

    // Cleanup function (not directly used here, but good practice)
    return () => {
      abortController.abort();
    };
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // If user navigates away while refreshing, reset state
      if (isRefreshing) {
        console.log('Component unmounting, stopping refresh');
      }
    };
  }, [isRefreshing]);

  // Warn user before leaving if refresh is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRefreshing) {
        e.preventDefault();
        e.returnValue = 'Price refresh is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRefreshing]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeSubTab === 'open') {
          const data = await getPositions(true); // Only active positions
          setPositions(data);
        } else {
          const data = await getTradeLots(undefined, 'CLOSED');
          setClosedLots(data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setExpandedTicker(null); // Reset expansion when switching tabs
    setCurrentPage(1);
  }, [activeSubTab]);

  const handleToggleExpand = async (ticker: string) => {
    if (expandedTicker === ticker) {
      setExpandedTicker(null);
      return;
    }

    setExpandedTicker(ticker);

    // Reset transaction pagination for this ticker
    setTransactionPages(prev => ({ ...prev, [ticker]: 1 }));

    if (!tickerTransactions[ticker]) {
      try {
        const allTransactions = await getTransactions(ticker);
        
        // Find the position's opened_date
        const position = positions.find(p => p.ticker === ticker);
        
        // Filter transactions to only include those on or after opened_date
        const filteredTransactions = position 
          ? allTransactions.filter(t => t.transaction_date >= position.opened_date)
          : allTransactions;
        
        setTickerTransactions(prev => ({ ...prev, [ticker]: filteredTransactions }));
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    }
  };

  const handleDeleteComplete = async () => {
    if (onDelete) {
      onDelete();
    }
    // Refresh data
    if (activeSubTab === 'open') {
      const data = await getPositions(true);
      setPositions(data);
      // Clear cached data for refresh
      setTickerLots({});
      setTickerTransactions({});
    } else {
      const data = await getTradeLots(undefined, 'CLOSED');
      setClosedLots(data);
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

  // Calculate totals for open positions (STOCKS ONLY)
  const openTotals = positions.reduce((acc, pos) => {
  // Case-insensitive check for stocks
  const isStock = 
  pos.asset_class_code?.toUpperCase() === 'STOCK' || 
  pos.asset_class?.toLowerCase().includes('stock');
  
  if (isStock) {
    acc.totalShares += pos.total_shares;
  }
  
  acc.totalValue += pos.current_value || 0;
  acc.unrealizedPL += pos.unrealized_pnl || 0;
  return acc;
  }, { totalShares: 0, totalValue: 0, unrealizedPL: 0 });

  // Calculate totals for closed lots
  const closedTotals = closedLots.reduce((acc, lot) => {
    acc.totalPL += lot.realized_pl || 0;
    acc.totalTrades += 1;
    if ((lot.realized_pl || 0) > 0) acc.winningTrades += 1;
    return acc;
  }, { totalPL: 0, totalTrades: 0, winningTrades: 0 });

  const winRate = closedTotals.totalTrades > 0 
    ? (closedTotals.winningTrades / closedTotals.totalTrades * 100).toFixed(1)
    : '0.0';

  const totalPages = Math.ceil(closedLots.length / pageSize);
  const paginatedLots = closedLots.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs with Refresh Button */}
      <div className="flex items-center gap-4">
        {/* Original Sub-tabs */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('open')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'open' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Open Trades</span>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
              {positions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('closed')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'closed' 
                ? 'bg-slate-600 text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <TrendingDown className="w-5 h-5" />
            <span>Closed Trades</span>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
              {closedLots.length}
            </span>
          </button>
        </div>

        {/* NEW: Refresh Prices Button (only shows on Open Trades tab) */}
        {activeSubTab === 'open' && (
          <button
            type="button"
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed group relative"
            title="Update market prices"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {isRefreshing ? 'Updating prices...' : 'Refresh market prices'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Refresh Error Message */}
      {refreshError && (
        <div className="backdrop-blur-xl bg-rose-500/20 border border-rose-400/30 rounded-2xl p-4">
          <p className="text-rose-200 text-sm">{refreshError}</p>
        </div>
      )}

      {/* Open Trades - Position Cards (copied from ByTickerView) */}
      {activeSubTab === 'open' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
              <p className="text-green-300 text-sm mb-1">Total Open Shares</p>
              <p className="text-white text-3xl font-bold">{openTotals.totalShares.toLocaleString()}</p>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
              <p className="text-blue-300 text-sm mb-1">Total Open Value</p>
              <p className="text-white text-3xl font-bold">${openTotals.totalValue.toFixed(2)}</p>
            </div>
            <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
              openTotals.unrealizedPL >= 0
                ? 'from-green-500/10 to-emerald-500/10 border-green-400/20'
                : 'from-rose-500/10 to-red-500/10 border-rose-400/20'
            }`}>
              <p className={`text-sm mb-1 ${openTotals.unrealizedPL >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
                Unrealized P/L
              </p>
              <p className="text-white text-3xl font-bold flex items-center gap-2">
                {openTotals.unrealizedPL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                ${openTotals.unrealizedPL.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Position Cards */}
          {positions.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
              <p className="text-blue-200 text-center">No open positions found.</p>
            </div>
          ) : (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card expansion
                              setSelectedPositionForAttributes(position);
                            }}
                            className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/50"
                            title="Assign Attributes"
                          >
                            <Tag className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                          <div>
                            <p className="text-blue-300">Shares</p>
                            <p className="text-white font-semibold">{position.total_shares.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-blue-300">Avg Price</p>
                            <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-blue-300">Invested Capital</p>
                            <p className="text-white font-semibold">
                              ${(position.total_shares * position.average_cost).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300">Current Market Price</p>
                            <p className="text-white font-semibold">
                              ${position.current_market_price ? position.current_market_price.toFixed(2) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300">Current Value</p>
                            <p className="text-white font-semibold">
                              ${position.current_value ? position.current_value.toFixed(2) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300">Unrealized P/L</p>
                            <p className={`font-semibold flex items-center gap-1 ${
                              (position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                            }`}>
                              {(position.unrealized_pnl || 0) >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              ${position.unrealized_pnl ? position.unrealized_pnl.toFixed(2) : '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300">Opened</p>
                            <p className="text-white font-semibold">
                              {new Date(position.opened_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
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

                      {/* Transaction History Section */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Transaction History</h4>
                        {tickerTransactions[position.ticker] && tickerTransactions[position.ticker].length > 0 ? (
                          <>
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
                                  {(() => {
                                    const currentPage = transactionPages[position.ticker] || 1;
                                    const startIdx = (currentPage - 1) * transactionPageSize;
                                    const endIdx = startIdx + transactionPageSize;
                                    const paginatedTransactions = tickerTransactions[position.ticker].slice(startIdx, endIdx);
                                    
                                    return paginatedTransactions.map((transaction) => (
                                      <tr key={transaction.transaction_id} className="border-b border-white/5">
                                        <td className="py-3 text-white">
                                          {new Date(transaction.transaction_date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
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
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>

                            {/* Transaction Pagination */}
                            {tickerTransactions[position.ticker].length > transactionPageSize && (() => {
                              const currentPage = transactionPages[position.ticker] || 1;
                              const totalPages = Math.ceil(tickerTransactions[position.ticker].length / transactionPageSize);
                              
                              return (
                                <div className="mt-4 flex items-center justify-between text-sm">
                                  <p className="text-blue-200">
                                    Showing {((currentPage - 1) * transactionPageSize) + 1} to {Math.min(currentPage * transactionPageSize, tickerTransactions[position.ticker].length)} of {tickerTransactions[position.ticker].length} transactions
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setTransactionPages(prev => ({ 
                                        ...prev, 
                                        [position.ticker]: Math.max(1, currentPage - 1) 
                                      }))}
                                      disabled={currentPage === 1}
                                      className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    >
                                      Previous
                                    </button>
                                    <span className="px-3 py-1 text-white">
                                      Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                      onClick={() => setTransactionPages(prev => ({ 
                                        ...prev, 
                                        [position.ticker]: Math.min(totalPages, currentPage + 1) 
                                      }))}
                                      disabled={currentPage === totalPages}
                                      className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <p className="text-blue-200 text-sm">No transactions found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Closed Trades - Table (continues below) */}
      {/* Closed Trades - Table */}
      {activeSubTab === 'closed' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
              closedTotals.totalPL >= 0 
                ? 'from-green-500/10 to-emerald-500/10 border-green-400/20'
                : 'from-rose-500/10 to-red-500/10 border-rose-400/20'
            }`}>
              <p className={`text-sm mb-1 ${closedTotals.totalPL >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
                Total Realized P/L
              </p>
              <p className="text-white text-3xl font-bold flex items-center gap-2">
                {closedTotals.totalPL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                ${closedTotals.totalPL.toFixed(2)}
              </p>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
              <p className="text-blue-300 text-sm mb-1">Win Rate</p>
              <p className="text-white text-3xl font-bold">
                {winRate}%
                <span className="text-sm text-blue-300 ml-2">
                  ({closedTotals.winningTrades}/{closedTotals.totalTrades})
                </span>
              </p>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
              <p className="text-purple-300 text-sm mb-1">Total Closed Trades</p>
              <p className="text-white text-3xl font-bold">{closedTotals.totalTrades}</p>
            </div>
          </div>

          {/* Closed Lots Table */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
            {paginatedLots.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-blue-200">No closed trade lots found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left text-blue-300 p-4">Ticker</th>
                        <th className="text-left text-blue-300 p-4">Entry Date</th>
                        <th className="text-left text-blue-300 p-4">Exit Date</th>
                        <th className="text-right text-blue-300 p-4">Qty</th>
                        <th className="text-right text-blue-300 p-4">Entry Price</th>
                        <th className="text-right text-blue-300 p-4">Exit Price</th>
                        <th className="text-right text-blue-300 p-4">P/L</th>
                        <th className="text-right text-blue-300 p-4">P/L %</th>
                        <th className="text-center text-blue-300 p-4">Hold Days</th>
                        <th className="text-center text-blue-300 p-4">Strategy</th>
                        <th className="text-center text-blue-300 p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLots.map((lot) => (
                        <tr key={lot.lot_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-semibold">{lot.ticker}</td>
                          <td className="p-4 text-white">
                            {new Date(lot.entry_date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-white">
                            {lot.exit_date ? new Date(lot.exit_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-right text-white">{lot.quantity}</td>
                          <td className="p-4 text-right text-white">${lot.entry_price.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">
                            {lot.exit_price ? `$${lot.exit_price.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-4 text-right font-bold ${
                            (lot.realized_pl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {lot.realized_pl ? `$${lot.realized_pl.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-4 text-right font-bold ${
                            (lot.realized_pl_percent || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {lot.realized_pl_percent ? `${lot.realized_pl_percent.toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-4 text-center text-white">
                            {lot.trade_hold_days || '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {getStrategyName(lot.trade_strategy)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 border rounded text-xs ${getStatusBadge(lot.lot_status)}`}>
                              {lot.lot_status}
                            </span>
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
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, closedLots.length)} of {closedLots.length} lots
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
        </>
      )}

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

      {/* Assign Attributes Modal */}
      <AssignAttributesModal
        position={selectedPositionForAttributes}
        onClose={() => setSelectedPositionForAttributes(null)}
        onSuccess={async () => {
          // Refresh positions data
          const data = await getPositions(true);
          setPositions(data);
        }}
      />
    </div>
  );
}