'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface RealizedTrade {
  realization_id: number;
  ticker: string;
  sale_date: string;
  entry_date: string;
  quantity: number;
  average_cost: number;
  sale_price: number;
  total_cost: number;
  total_proceeds: number;
  realized_pnl: number;
  fees: number;
  notes: string | null;
}

interface OpenPosition {
  position_id: number;
  ticker: string;
  ticker_name: string;
  opened_date: string;
  total_shares: number;
  average_cost: number;
  current_market_price: number;
  current_value: number;
  unrealized_pnl: number;
}

interface CombinedView {
  id: string;
  ticker: string;
  entryDate: string;
  exitDate: string | null;
  quantity: number;
  avgCost: number;
  exitPrice: number | null;
  pnl: number;
  pnlType: 'realized' | 'unrealized';
  fees: number;
  notes: string | null;
  isClosed: boolean;
}

export function ByDateView() {
  const [closedTrades, setClosedTrades] = useState<RealizedTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedView[]>([]);
  const [filteredData, setFilteredData] = useState<CombinedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter states
  const [filters, setFilters] = useState({
    dateType: 'entry', // 'entry' or 'exit'
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch closed trades
        const historyResponse = await fetch('/api/trades/realized-history');
        const historyData = await historyResponse.json();
        setClosedTrades(historyData.history);

        // Fetch open positions
        const positionsResponse = await fetch('/api/positions');
        const positionsResult = await positionsResponse.json();
        const positionsData = positionsResult.data || [];
        setOpenPositions(positionsData);

        // Combine both datasets
        const combined: CombinedView[] = [
          // Closed trades
          ...historyData.history.map((trade: RealizedTrade) => ({
            id: `closed-${trade.realization_id}`,
            ticker: trade.ticker,
            entryDate: trade.entry_date,
            exitDate: trade.sale_date,
            quantity: trade.quantity,
            avgCost: trade.average_cost,
            exitPrice: trade.sale_price,
            pnl: trade.realized_pnl,
            pnlType: 'realized' as 'realized' | 'unrealized',
            fees: trade.fees,
            notes: trade.notes,
            isClosed: true,
          })),
          // Open positions
          ...positionsData.map((pos: OpenPosition) => ({
            id: `open-${pos.position_id}`,
            ticker: pos.ticker,
            entryDate: pos.opened_date,
            exitDate: null,
            quantity: pos.total_shares,
            avgCost: pos.average_cost,
            exitPrice: pos.current_market_price,
            pnl: pos.unrealized_pnl,
            pnlType: 'unrealized' as 'realized' | 'unrealized',
            fees: 0,
            notes: null,
            isClosed: false,
          })),
        ];

        // Sort by entry date descending
        combined.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

        setCombinedData(combined);
        setFilteredData(combined);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...combinedData];

    const { dateType, dateFrom, dateTo } = filters;

    if (dateFrom) {
      if (dateTo) {
        // Date range: use >= and <=
        if (dateType === 'entry') {
          filtered = filtered.filter(item => 
            item.entryDate >= dateFrom && item.entryDate <= dateTo
          );
        } else {
          // Exit date filter only applies to closed trades
          filtered = filtered.filter(item => 
            item.isClosed && item.exitDate && 
            item.exitDate >= dateFrom && item.exitDate <= dateTo
          );
        }
      } else {
        // Single date: use exact match (=)
        if (dateType === 'entry') {
          filtered = filtered.filter(item => item.entryDate === dateFrom);
        } else {
          // Exit date filter only applies to closed trades
          filtered = filtered.filter(item => 
            item.isClosed && item.exitDate === dateFrom
          );
        }
      }
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [filters, combinedData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate summary stats
  const stats = filteredData.reduce((acc, item) => {
    acc.totalTrades += 1;
    acc.totalFees += item.fees;
    
    if (item.isClosed) {
      acc.closedCount += 1;
      acc.realizedPnL += item.pnl;
    } else {
      acc.openCount += 1;
      acc.unrealizedPnL += item.pnl;
    }
    
    acc.totalPnL += item.pnl;
    return acc;
  }, {
    totalTrades: 0,
    totalFees: 0,
    closedCount: 0,
    openCount: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalPnL: 0
  });

  const handleRefresh = async () => {
    // Refresh both datasets
    const historyResponse = await fetch('/api/trades/realized-history');
    const historyData = await historyResponse.json();
    setClosedTrades(historyData.history);

    const positionsResponse = await fetch('/api/positions');
    const positionsResult = await positionsResponse.json();
    const positionsData = Array.isArray(positionsResult) ? positionsResult : (positionsResult.positions || []);
    setOpenPositions(positionsData);
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
          <h3 className="text-lg font-bold text-white">Filter Trades</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Date Type Toggle */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Filter By</label>
            <SegmentedControl
              options={[
                { value: 1, label: 'Entry Date', icon: <TrendingUp className="w-4 h-4" /> },
                { value: 2, label: 'Exit Date', icon: <TrendingDown className="w-4 h-4" /> },
              ]}
              value={filters.dateType === 'entry' ? 1 : 2}
              onChange={(value) => setFilters({ ...filters, dateType: value === 1 ? 'entry' : 'exit', dateFrom: '', dateTo: '' })}
            />
          </div>

          {/* From Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
              suppressHydrationWarning
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Date To (Optional)</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
              suppressHydrationWarning
              disabled={!filters.dateFrom}
            />
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            {(filters.dateFrom || filters.dateTo) && (
              <GlassButton
                icon={X}
                onClick={() => setFilters({ dateType: 'entry', dateFrom: '', dateTo: '' })}
                tooltip="Clear Filters"
                variant="secondary"
                size="lg"
              />
            )}
          </div>
        </div>

        <p className="text-blue-300 text-xs mt-3">
          💡 Leave "Date To" empty for exact date match, or fill both for date range
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
          <p className="text-blue-300 text-sm mb-1">Total Trades</p>
          <p className="text-white text-3xl font-bold">{stats.totalTrades}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
          <p className="text-green-300 text-sm mb-1">Open Positions</p>
          <p className="text-white text-2xl font-bold">{stats.openCount}</p>
          <p className="text-green-200 text-sm">${stats.unrealizedPnL.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-2xl p-6 border border-slate-400/20">
          <p className="text-slate-300 text-sm mb-1">Closed Trades</p>
          <p className="text-white text-2xl font-bold">{stats.closedCount}</p>
          <p className="text-slate-200 text-sm">${stats.realizedPnL.toFixed(2)}</p>
        </div>
        <div className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-6 border ${
          stats.totalPnL >= 0
            ? 'from-green-500/10 to-emerald-500/10 border-green-400/20'
            : 'from-rose-500/10 to-red-500/10 border-rose-400/20'
        }`}>
          <p className={`text-sm mb-1 ${stats.totalPnL >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
            Total P/L
          </p>
          <p className="text-white text-3xl font-bold">${stats.totalPnL.toFixed(2)}</p>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
          <p className="text-purple-300 text-sm mb-1">Total Fees</p>
          <p className="text-white text-3xl font-bold">${stats.totalFees.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
        {paginatedData.length === 0 ? (
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
                    <th className="text-left text-blue-300 p-4">Ticker</th>
                    <th className="text-left text-blue-300 p-4">Entry Date</th>
                    <th className="text-left text-blue-300 p-4">Exit Date</th>
                    <th className="text-right text-blue-300 p-4">Quantity</th>
                    <th className="text-right text-blue-300 p-4">Avg Cost</th>
                    <th className="text-right text-blue-300 p-4">Exit/Current Price</th>
                    <th className="text-right text-blue-300 p-4">Fees</th>
                    <th className="text-right text-blue-300 p-4">P/L</th>
                    <th className="text-center text-blue-300 p-4">Status</th>
                    <th className="text-left text-blue-300 p-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-semibold">{item.ticker}</td>
                      <td className="p-4 text-white">
                        {new Date(item.entryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="p-4 text-white">
                        {item.exitDate ? new Date(item.exitDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : '-'}
                      </td>
                      <td className="p-4 text-right text-white">{item.quantity.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${item.avgCost.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">
                        {item.exitPrice ? `$${item.exitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 text-right text-white">${item.fees.toFixed(2)}</td>
                      <td className={`p-4 text-right font-bold text-lg ${
                        item.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${item.pnl.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.isClosed
                            ? 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                            : 'bg-green-500/20 text-green-300 border border-green-400/30'
                        }`}>
                          {item.isClosed ? 'Closed' : 'Open'}
                        </span>
                        <br />
                        <span className="text-xs text-blue-200 mt-1">
                          {item.pnlType === 'realized' ? 'Realized' : 'Unrealized'}
                        </span>
                      </td>
                      <td className="p-4 text-white text-xs truncate max-w-[150px]">
                        {item.notes || '-'}
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
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} trades
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