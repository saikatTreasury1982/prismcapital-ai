'use client';

import { useState, useEffect } from 'react';
import { List } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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

export function ByTickerView() {
  const [trades, setTrades] = useState<RealizedTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<RealizedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter state
  const [selectedTicker, setSelectedTicker] = useState<string>('all');
  const [uniqueTickers, setUniqueTickers] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades/realized-history');
        const data = await response.json();
        setTrades(data.history);
        setFilteredTrades(data.history);

        // Extract unique tickers
        const tickers = Array.from(new Set(data.history.map((t: RealizedTrade) => t.ticker))) as string[];
        setUniqueTickers(tickers.sort());
      } catch (err) {
        console.error('Failed to fetch trades:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Apply ticker filter
  useEffect(() => {
    let filtered = [...trades];

    if (selectedTicker !== 'all') {
      filtered = filtered.filter(t => t.ticker === selectedTicker);
    }

    setFilteredTrades(filtered);
    setCurrentPage(1);
  }, [selectedTicker, trades]);

  const totalPages = Math.ceil(filteredTrades.length / pageSize);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate summary stats
  const stats = filteredTrades.reduce((acc, t) => {
    acc.totalTrades += 1;
    acc.totalProceeds += t.total_proceeds;
    acc.totalCost += t.total_cost;
    acc.totalPnL += t.realized_pnl;
    acc.totalFees += t.fees;
    acc.totalQuantity += t.quantity;
    
    if (t.realized_pnl >= 0) {
      acc.profitCount += 1;
      acc.totalProfit += t.realized_pnl;
    } else {
      acc.lossCount += 1;
      acc.totalLoss += Math.abs(t.realized_pnl);
    }
    
    return acc;
  }, {
    totalTrades: 0,
    totalProceeds: 0,
    totalCost: 0,
    totalPnL: 0,
    totalFees: 0,
    totalQuantity: 0,
    profitCount: 0,
    totalProfit: 0,
    lossCount: 0,
    totalLoss: 0,
  });

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading closed trades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <List className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Filter by Ticker</h3>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-blue-200 text-sm font-medium whitespace-nowrap">Select Ticker</label>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="w-48 funding-input rounded-xl px-3 py-2 text-sm"
          >
            <option value="all" className="bg-slate-800 text-white">All Tickers</option>
            {uniqueTickers.map(ticker => (
              <option key={ticker} value={ticker} className="bg-slate-800 text-white">
                {ticker}
              </option>
            ))}
          </select>
          
          {selectedTicker !== 'all' && (
            <GlassButton
              icon={X}
              onClick={() => setSelectedTicker('all')}
              tooltip="Clear Filter"
              variant="secondary"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
          <p className="text-blue-300 text-sm mb-1">Closed Trades</p>
          <p className="text-white text-3xl font-bold">{stats.totalTrades}</p>
          <p className="text-blue-200 text-xs mt-1">{stats.totalQuantity.toFixed(2)} shares</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
          <p className="text-green-300 text-sm mb-1">Profitable Trades</p>
          <p className="text-white text-2xl font-bold">{stats.profitCount}</p>
          <p className="text-green-200 text-xs mt-1">+${stats.totalProfit.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-2xl p-6 border border-rose-400/20">
          <p className="text-rose-300 text-sm mb-1">Loss Trades</p>
          <p className="text-white text-2xl font-bold">{stats.lossCount}</p>
          <p className="text-rose-200 text-xs mt-1">-${stats.totalLoss.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-400/20">
          <p className="text-amber-300 text-sm mb-1">Total P/L</p>
          <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
          <p className="text-purple-300 text-sm mb-1">Total Fees</p>
          <p className="text-white text-3xl font-bold">${stats.totalFees.toFixed(2)}</p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
        {paginatedTrades.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-200">No closed trades found for the selected ticker.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-blue-300 p-4">Sale Date</th>
                    <th className="text-left text-blue-300 p-4">Ticker</th>
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
                  {paginatedTrades.map((trade) => (
                    <tr key={trade.realization_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white">
                        {new Date(trade.sale_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="p-4 text-white font-semibold">{trade.ticker}</td>
                      <td className="p-4 text-right text-white">{trade.quantity.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${trade.average_cost.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${trade.sale_price.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${trade.total_cost.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${trade.total_proceeds.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${trade.fees.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold text-lg ${trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${trade.realized_pnl.toFixed(2)}
                        </span>
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
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length} trades
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
    </div>
  );
}