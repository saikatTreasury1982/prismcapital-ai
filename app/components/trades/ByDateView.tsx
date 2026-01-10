'use client';

import { useState, useEffect } from 'react';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { Calendar, List, Save, Edit2, Filter, FilterX, X, ChevronLeft, ChevronRight,ChevronUp, ChevronDown, ChevronsUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';
import { NotesPopover } from '@/app/lib/ui/NotesPopover';

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
  is_active?: number;
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
    dateTo: '',
    ticker: 'all'
  });

  // Sort state
  type SortField = 'ticker' | 'entry_date' | 'exit_date' | 'quantity' | 'avg_cost' | 'exit_price' | 'fees' | 'pnl' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('entry_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueTickers, setUniqueTickers] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch closed trades
        const historyResponse = await fetch('/api/trades/realized-history');
        const historyData = await historyResponse.json();
        setClosedTrades(historyData.history);

        // Fetch open positions (only active ones)
        const positionsResponse = await fetch('/api/positions?isActive=true');
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

        // Extract unique tickers
        const uniqueTickersSet = new Set(combined.map(item => item.ticker));
        const tickersArray = Array.from(uniqueTickersSet).sort();
        setUniqueTickers(tickersArray);

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

    const { dateType, dateFrom, dateTo, ticker } = filters;

    // Filter by ticker
    if (ticker !== 'all') {
      filtered = filtered.filter(item => item.ticker === ticker);
    }

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

    // Filter by search term (notes)
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'entry_date':
          aVal = new Date(a.entryDate).getTime();
          bVal = new Date(b.entryDate).getTime();
          break;
        case 'exit_date':
          aVal = a.exitDate ? new Date(a.exitDate).getTime() : 0;
          bVal = b.exitDate ? new Date(b.exitDate).getTime() : 0;
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'avg_cost':
          aVal = a.avgCost;
          bVal = b.avgCost;
          break;
        case 'exit_price':
          aVal = a.exitPrice || 0;
          bVal = b.exitPrice || 0;
          break;
        case 'fees':
          aVal = a.fees;
          bVal = b.fees;
          break;
        case 'pnl':
          aVal = a.pnl;
          bVal = b.pnl;
          break;
        case 'status':
          aVal = a.isClosed ? 1 : 0;
          bVal = b.isClosed ? 1 : 0;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [filters, searchTerm, sortField, sortDirection, combinedData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 inline ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const clearAllFilters = () => {
    setFilters({ dateType: 'entry', dateFrom: '', dateTo: '', ticker: 'all' });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.ticker !== 'all' || searchTerm;

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
      {/* Summary Stats - At Top */}
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

      {/* Main Table with Filters */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">All Transactions by Date</h2>
            <p className="text-xs text-blue-300 mt-1">
              Showing {filteredData.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} transactions
            </p>
          </div>
          <GlassButton
            icon={showFilters ? X : Filter}
            onClick={() => setShowFilters(!showFilters)}
            tooltip={showFilters ? 'Hide Filters' : 'Show Filters'}
            variant="primary"
            size="sm"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
            {/* First Row: Ticker and Search Notes */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker</label>
                <select
                  value={filters.ticker}
                  onChange={(e) => setFilters({ ...filters, ticker: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                >
                  <option value="all" className="bg-slate-800 text-white">All Tickers</option>
                  {uniqueTickers.map(ticker => (
                    <option key={ticker} value={ticker} className="bg-slate-800 text-white">
                      {ticker}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-blue-200 text-sm mb-2 block font-medium">Search Notes</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in notes..."
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                />
              </div>

              <div className="flex items-end">
                <GlassButton
                  icon={FilterX}
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  tooltip="Clear All Filters"
                  variant="secondary"
                  size="sm"
                />
              </div>
            </div>

            {/* Second Row: Filter By Toggle and Dates */}
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
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
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
                  className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                  suppressHydrationWarning
                  disabled={!filters.dateFrom}
                />
              </div>
            </div>

            {/* Help Text */}
            <p className="text-blue-300 text-xs">
              💡 Leave "Date To" empty for exact date match, or fill both for date range
            </p>
          </div>
        )}

        {/* Table */}
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-200">No transactions found for the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/20">
                    <th 
                      className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('ticker')}
                    >
                      Ticker {getSortIcon('ticker')}
                    </th>
                    <th 
                      className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('entry_date')}
                    >
                      Entry Date {getSortIcon('entry_date')}
                    </th>
                    <th 
                      className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('exit_date')}
                    >
                      Exit Date {getSortIcon('exit_date')}
                    </th>
                    <th 
                      className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      Quantity {getSortIcon('quantity')}
                    </th>
                    <th 
                      className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('avg_cost')}
                    >
                      Avg Cost {getSortIcon('avg_cost')}
                    </th>
                    <th 
                      className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('exit_price')}
                    >
                      Exit/Current Price {getSortIcon('exit_price')}
                    </th>
                    <th 
                      className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('fees')}
                    >
                      Fees {getSortIcon('fees')}
                    </th>
                    <th 
                      className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('pnl')}
                    >
                      P/L {getSortIcon('pnl')}
                    </th>
                    <th 
                      className="text-center text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th className="text-left text-blue-200 p-2 font-semibold">
                      Notes <ChevronsUpDown className="w-4 h-4 inline ml-1 opacity-40" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-2 text-white font-semibold">{item.ticker}</td>
                      <td className="p-2 text-white">
                        {new Date(item.entryDate).toLocaleDateString('en-GB', { 
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="p-2 text-white">
                        {item.exitDate ? new Date(item.exitDate).toLocaleDateString('en-GB', { 
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric' 
                        }) : '-'}
                      </td>
                      <td className="p-2 text-right text-white">{item.quantity.toFixed(2)}</td>
                      <td className="p-2 text-right text-white">${item.avgCost.toFixed(2)}</td>
                      <td className="p-2 text-right text-white">
                        {item.exitPrice ? `$${item.exitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-2 text-right text-white">${item.fees.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        <div className={`font-bold ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${item.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-200 mt-0.5">
                          {item.pnlType === 'realized' ? 'Realized' : 'Unrealized'}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.isClosed
                            ? 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                            : 'bg-green-500/20 text-green-300 border border-green-400/30'
                        }`}>
                          {item.isClosed ? 'Closed' : 'Open'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <NotesPopover 
                          notes={item.notes}
                          title={`Notes - ${item.ticker} • ${item.isClosed ? 'Sale' : 'Position'}: ${new Date(item.entryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}