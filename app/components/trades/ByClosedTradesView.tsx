'use client';

import { useState, useEffect } from 'react';
import { List, Save, Edit2, Filter, FilterX, X, ChevronLeft, ChevronRight,ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';

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

export function ByClosedTradesView() {
  const [trades, setTrades] = useState<RealizedTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<RealizedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter state
  const [selectedTicker, setSelectedTicker] = useState<string>('all');
  const [uniqueTickers, setUniqueTickers] = useState<string[]>([]);
  // Sort state
  type SortField = 'ticker' | 'entry_date' | 'sale_date' | 'quantity' | 'avg_cost' | 'sale_price' | 'total_cost' | 'proceeds' | 'fees' | 'pnl';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('sale_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTrade, setEditingTrade] = useState<RealizedTrade | null>(null);
  const [editFormData, setEditFormData] = useState({
    sale_date: '',
    quantity: '',
    average_cost: '',
    sale_price: '',
    fees: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Apply filters, search, and sorting
  useEffect(() => {
    let filtered = [...trades];

    // Filter by ticker
    if (selectedTicker !== 'all') {
      filtered = filtered.filter(t => t.ticker === selectedTicker);
    }

    // Filter by search term (notes)
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
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
          aVal = new Date(a.entry_date).getTime();
          bVal = new Date(b.entry_date).getTime();
          break;
        case 'sale_date':
          aVal = new Date(a.sale_date).getTime();
          bVal = new Date(b.sale_date).getTime();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'avg_cost':
          aVal = a.average_cost;
          bVal = b.average_cost;
          break;
        case 'sale_price':
          aVal = a.sale_price;
          bVal = b.sale_price;
          break;
        case 'total_cost':
          aVal = a.total_cost;
          bVal = b.total_cost;
          break;
        case 'proceeds':
          aVal = a.total_proceeds;
          bVal = b.total_proceeds;
          break;
        case 'fees':
          aVal = a.fees;
          bVal = b.fees;
          break;
        case 'pnl':
          aVal = a.realized_pnl;
          bVal = b.realized_pnl;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredTrades(filtered);
    setCurrentPage(1);
    }, [selectedTicker, searchTerm, sortField, sortDirection, trades]);

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
    setSelectedTicker('all');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedTicker !== 'all' || searchTerm;

  const handleEditClick = (trade: RealizedTrade) => {
    setEditingTrade(trade);
    setEditFormData({
      sale_date: trade.sale_date,
      quantity: trade.quantity.toString(),
      average_cost: trade.average_cost.toString(),
      sale_price: trade.sale_price.toString(),
      fees: trade.fees.toString(),
      notes: trade.notes || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingTrade) return;

    // Validation
    if (!editFormData.sale_date || !editFormData.quantity || !editFormData.average_cost || !editFormData.sale_price) {
      setEditError('Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(editFormData.quantity);
    const avgCost = parseFloat(editFormData.average_cost);
    const salePrice = parseFloat(editFormData.sale_price);
    const fees = parseFloat(editFormData.fees);

    if (isNaN(quantity) || isNaN(avgCost) || isNaN(salePrice) || isNaN(fees)) {
      setEditError('Please enter valid numbers');
      return;
    }

    if (quantity <= 0 || avgCost <= 0 || salePrice <= 0 || fees < 0) {
      setEditError('Invalid values entered');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/trades/realized-history/${editingTrade.realization_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_date: editFormData.sale_date,
          quantity: quantity,
          average_cost: avgCost,
          sale_price: salePrice,
          fees: fees,
          notes: editFormData.notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update trade');
      }

      // Refresh trades list
      const tradesResponse = await fetch('/api/trades/realized-history');
      const data = await tradesResponse.json();
      setTrades(data.history);
      setFilteredTrades(data.history);

      // Apply current filter
      if (selectedTicker !== 'all') {
        setFilteredTrades(data.history.filter((t: RealizedTrade) => t.ticker === selectedTicker));
      }

      setEditingTrade(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
    setEditError(null);
  };

  // Calculate values for edit form
  const editTotalCost = editFormData.quantity && editFormData.average_cost
    ? (parseFloat(editFormData.quantity) * parseFloat(editFormData.average_cost)).toFixed(2)
    : '0.00';

  const editProceeds = editFormData.quantity && editFormData.sale_price
    ? (parseFloat(editFormData.quantity) * parseFloat(editFormData.sale_price)).toFixed(2)
    : '0.00';

  const editRealizedPnL = editFormData.quantity && editFormData.average_cost && editFormData.sale_price
    ? ((parseFloat(editFormData.quantity) * parseFloat(editFormData.sale_price)) - 
      (parseFloat(editFormData.quantity) * parseFloat(editFormData.average_cost))).toFixed(2)
    : '0.00';

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
    {/* Summary Stats - Moved to Top */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Closed Trades */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20">
        <p className="text-blue-300 text-sm mb-1">Closed Trades</p>
        <p className="text-white text-3xl font-bold">{stats.totalTrades}</p>
        <p className="text-blue-200 text-xs mt-1">{stats.totalQuantity.toFixed(2)} shares</p>
      </div>

      {/* Profitable Trades */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20">
        <p className="text-green-300 text-sm mb-1">Profitable Trades</p>
        <p className="text-white text-2xl font-bold">{stats.profitCount}</p>
        <p className="text-green-200 text-xs mt-1">+${stats.totalProfit.toFixed(2)}</p>
      </div>

      {/* Loss Trades */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 rounded-2xl p-6 border border-rose-400/20">
        <p className="text-rose-300 text-sm mb-1">Loss Trades</p>
        <p className="text-white text-2xl font-bold">{stats.lossCount}</p>
        <p className="text-rose-200 text-xs mt-1">-${stats.totalLoss.toFixed(2)}</p>
      </div>

      {/* Win Rate */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-400/20">
        <p className="text-blue-300 text-sm mb-1">Win Rate</p>
        <p className="text-white text-3xl font-bold">
          {stats.totalTrades > 0 
            ? ((stats.profitCount / stats.totalTrades) * 100).toFixed(1)
            : '0.0'}%
        </p>
        <p className="text-blue-200 text-xs mt-1">
          {stats.profitCount}/{stats.totalTrades} trades
        </p>
      </div>

      {/* Total P/L */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-amber-400/20">
        <p className="text-amber-300 text-sm mb-1">Total P/L</p>
        <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${stats.totalPnL.toFixed(2)}
        </p>
      </div>

      {/* Total Fees */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20">
        <p className="text-purple-300 text-sm mb-1">Total Fees</p>
        <p className="text-white text-3xl font-bold">${stats.totalFees.toFixed(2)}</p>
      </div>
    </div>

    {/* Main Table with Filter Header */}
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">All Closed Trades</h2>
          <p className="text-xs text-blue-300 mt-1">
            Showing {filteredTrades.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0}-{Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length} trades
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

      {/* Filter Section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-blue-200 text-sm mb-2 block font-medium">Filter by Ticker</label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
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

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-blue-300 text-sm font-medium">Active filters:</span>
              {selectedTicker !== 'all' && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                  Ticker: {selectedTicker}
                  <button onClick={() => setSelectedTicker('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div> 
      )}

      {/* Table */}
      {paginatedTrades.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-blue-200">No closed trades found for the selected ticker.</p>
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
                    onClick={() => handleSort('sale_date')}
                  >
                    Sale Date {getSortIcon('sale_date')}
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
                    onClick={() => handleSort('sale_price')}
                  >
                    Sale Price {getSortIcon('sale_price')}
                  </th>
                  <th 
                    className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('total_cost')}
                  >
                    Total Cost {getSortIcon('total_cost')}
                  </th>
                  <th 
                    className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('proceeds')}
                  >
                    Proceeds {getSortIcon('proceeds')}
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
                    Realized P/L {getSortIcon('pnl')}
                  </th>
                  <th className="text-left text-blue-200 p-2 font-semibold">
                    Notes <ChevronsUpDown className="w-4 h-4 inline ml-1 opacity-40" />
                  </th>
                  <th className="text-center text-blue-200 p-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade) => (
                  <tr key={trade.realization_id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-2 text-white font-semibold">{trade.ticker}</td>
                    <td className="p-2 text-white">
                      {new Date(trade.entry_date).toLocaleDateString('en-GB', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-2 text-white">
                      {new Date(trade.sale_date).toLocaleDateString('en-GB', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-2 text-right text-white">{trade.quantity.toFixed(2)}</td>
                    <td className="p-2 text-right text-white">${trade.average_cost.toFixed(2)}</td>
                    <td className="p-2 text-right text-white">${trade.sale_price.toFixed(2)}</td>
                    <td className="p-2 text-right text-white">${trade.total_cost.toFixed(2)}</td>
                    <td className="p-2 text-right text-white">${trade.total_proceeds.toFixed(2)}</td>
                    <td className="p-2 text-right text-white">${trade.fees.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${trade.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${trade.realized_pnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2 text-white text-xs max-w-[150px]">
                      <div className="line-clamp-2">
                        {trade.notes ? <BulletDisplay text={trade.notes} /> : <span className="text-blue-300 italic">No notes</span>}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleEditClick(trade)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-300" />
                        </button>
                      </div>
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

    {/* Edit Modal - Keep as is */}
    {editingTrade && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 max-w-2xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Edit Trade - {editingTrade.ticker}</h2>
            <div className="flex items-center gap-2">
              <GlassButton
                icon={Save}
                onClick={handleSaveEdit}
                disabled={isSaving}
                tooltip={isSaving ? 'Saving...' : 'Save Changes'}
                variant="primary"
                size="md"
              />
              <GlassButton
                icon={X}
                onClick={handleCancelEdit}
                disabled={isSaving}
                tooltip="Close"
                variant="secondary"
                size="md"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {editError && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              {/* Sale Date */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Sale Date *</label>
                <input
                  type="date"
                  value={editFormData.sale_date}
                  onChange={(e) => setEditFormData({ ...editFormData, sale_date: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Average Cost */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Average Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.average_cost}
                    onChange={(e) => setEditFormData({ ...editFormData, average_cost: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sale Price */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Sale Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.sale_price}
                    onChange={(e) => setEditFormData({ ...editFormData, sale_price: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Fees */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Fees</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.fees}
                    onChange={(e) => setEditFormData({ ...editFormData, fees: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Auto-calculated fields */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-3 font-medium">Calculated Values</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-300 mb-1">Total Cost</p>
                    <p className="text-white font-semibold">${editTotalCost}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 mb-1">Proceeds</p>
                    <p className="text-white font-semibold">${editProceeds}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 mb-1">Realized P/L</p>
                    <p className={`font-semibold ${parseFloat(editRealizedPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${editRealizedPnL}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
                <BulletTextarea
                  value={editFormData.notes}
                  onChange={(value) => setEditFormData({ ...editFormData, notes: value })}
                  disabled={isSaving}
                  rows={4}
                  placeholder="Optional notes (use • for bullet points)..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}