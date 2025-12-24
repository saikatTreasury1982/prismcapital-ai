'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sliders, RefreshCw } from 'lucide-react';
import { Position, Transaction } from '../../lib/types/transaction';
import { getPositions } from '../../services/positionServiceClient';
import { getTransactions } from '../../services/transactionServiceClient';
import { AssignAttributesModal } from './AssignAttributesModal';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface RealizedTrade {
  realization_id: number;
  ticker: string;
  sale_date: string;
  quantity: number;
  average_cost: number;
  total_cost: number;
  sale_price: number;
  total_proceeds: number;
  realized_pnl: number;
  entry_date: string;
  position_currency: string;
  fees: number;
  notes: string | null;
}

export function ByStatusView() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'closed'>('open');
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedLots, setClosedLots] = useState<RealizedTrade[]>([]);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerTransactions, setTickerTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
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
          const response = await fetch('/api/trades/realized-history');
          const data = await response.json();
          setClosedLots(data.history);
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
        const filteredTransactions = position && position.opened_date
        ? allTransactions.filter(t => t.transaction_date >= position.opened_date!)
        : allTransactions;
        
        setTickerTransactions(prev => ({ ...prev, [ticker]: filteredTransactions }));
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    }
  };

  // Calculate totals for open positions (STOCKS ONLY)
  const openTotals = positions.reduce((acc, pos) => {
    acc.totalShares += pos.total_shares;
    acc.totalValue += pos.current_value || 0;
    acc.unrealizedPL += pos.unrealized_pnl || 0;
    return acc;
  }, { totalShares: 0, totalValue: 0, unrealizedPL: 0 });

  // Calculate totals for closed trades
  const closedTotals = closedLots.reduce((acc, trade) => {
    acc.totalPL += trade.realized_pnl || 0;
    acc.totalTrades += 1;
    if ((trade.realized_pnl || 0) > 0) acc.winningTrades += 1;
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
        <SegmentedControl
          options={[
            { 
              value: 1, 
              label: `Open Trades (${positions.length})`, 
              icon: <TrendingUp className="w-4 h-4" /> 
            },
            { 
              value: 2, 
              label: `Closed Trades (${closedLots.length})`, 
              icon: <TrendingDown className="w-4 h-4" /> 
            },
          ]}
          value={activeSubTab === 'open' ? 1 : 2}
          onChange={(value) => setActiveSubTab(value === 1 ? 'open' : 'closed')}
        />

        {/* Refresh Prices Button (only shows on Open Trades tab) */}
        {activeSubTab === 'open' && (
          <GlassButton
            icon={RefreshCw}
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            tooltip={isRefreshing ? 'Updating prices...' : 'Refresh market prices'}
            variant="secondary"
            size="md"
            className={isRefreshing ? 'animate-spin' : ''}
          />
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
                              e.stopPropagation();
                              setSelectedPositionForAttributes(position);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Assign Attributes"
                          >
                            <Sliders className="w-4 h-4" />
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
                              {position.opened_date ? new Date(position.opened_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'N/A'}
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
                                    <th className="text-left text-blue-300 pb-2 px-2">Date</th>
                                    <th className="text-center text-blue-300 pb-2 px-2">Type</th>
                                    <th className="text-right text-blue-300 pb-2 px-2">Quantity</th>
                                    <th className="text-right text-blue-300 pb-2 px-2">Price</th>
                                    <th className="text-right text-blue-300 pb-2 px-2">Fees</th>
                                    <th className="text-right text-blue-300 pb-2 px-4">Trade Value</th>
                                    <th className="text-left text-blue-300 pb-2 px-4">Notes</th>
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
                                        <td className="py-3 px-2 text-white">
                                          {new Date(transaction.transaction_date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            transaction.transaction_type_id === 1 
                                              ? 'bg-green-500/20 text-green-300' 
                                              : 'bg-rose-500/20 text-rose-300'
                                          }`}>
                                            {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-white">{transaction.quantity}</td>
                                        <td className="py-3 px-2 text-right text-white">${transaction.price.toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right text-white">${transaction.fees.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-white">${(transaction.trade_value ||0).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-white text-sm">
                                          {transaction.notes || '-'}
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
                                  <div className="flex gap-2 items-center">
                                    <GlassButton
                                      icon={ChevronLeft}
                                      onClick={() => setTransactionPages(prev => ({ 
                                        ...prev, 
                                        [position.ticker]: Math.max(1, currentPage - 1) 
                                      }))}
                                      disabled={currentPage === 1}
                                      tooltip="Previous Page"
                                      variant="primary"
                                      size="sm"
                                    />
                                    <span className="px-3 py-1 text-white text-xs">
                                      Page {currentPage} of {totalPages}
                                    </span>
                                    <GlassButton
                                      icon={ChevronRight}
                                      onClick={() => setTransactionPages(prev => ({ 
                                        ...prev, 
                                        [position.ticker]: Math.min(totalPages, currentPage + 1) 
                                      }))}
                                      disabled={currentPage === totalPages}
                                      tooltip="Next Page"
                                      variant="primary"
                                      size="sm"
                                    />
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
                        <th className="text-left text-blue-300 p-4">Sale Date</th>
                        <th className="text-right text-blue-300 p-4">Quantity</th>
                        <th className="text-right text-blue-300 p-4">Avg Cost</th>
                        <th className="text-right text-blue-300 p-4">Sale Price</th>
                        <th className="text-right text-blue-300 p-4">Total Cost</th>
                        <th className="text-right text-blue-300 p-4">Proceeds</th>
                        <th className="text-right text-blue-300 p-4">Fees</th>
                        <th className="text-right text-blue-300 p-4">Realized P/L</th>
                        <th className="text-left text-blue-300 p-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLots.map((trade) => (
                        <tr key={trade.realization_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-semibold">{trade.ticker}</td>
                          <td className="p-4 text-white">
                            {new Date(trade.entry_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="p-4 text-white">
                            {new Date(trade.sale_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="p-4 text-right text-white">{trade.quantity.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">${trade.average_cost.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">${trade.sale_price.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">${trade.total_cost.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">${trade.total_proceeds.toFixed(2)}</td>
                          <td className="p-4 text-right text-white">${trade.fees.toFixed(2)}</td>
                          <td className={`p-4 text-right font-bold text-lg ${
                            trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${trade.realized_pnl.toFixed(2)}
                          </td>
                          <td className="p-4 text-white text-xs truncate max-w-[150px]">
                            {trade.notes || '-'}
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
                    <div className="flex gap-2 items-center">
                      <GlassButton
                        icon={ChevronLeft}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        tooltip="Previous Page"
                        variant="primary"
                        size="md"
                      />
                      <span className="px-4 py-2 text-white font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <GlassButton
                        icon={ChevronRight}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        tooltip="Next Page"
                        variant="primary"
                        size="md"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

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