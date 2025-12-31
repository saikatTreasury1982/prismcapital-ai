'use client';

import { useState, useEffect } from 'react';
import { Edit2, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Filter, X } from 'lucide-react';
import { CashMovementWithDirection } from '../../lib/types/funding';
import { EditFundingModal } from './EditFundingModal';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletDisplay } from '@/app/lib/ui/BulletTextarea';

interface AllFundingMovementsProps {
  homeCurrency: string;
  tradingCurrency: string;
}

type SortField = 'date' | 'type' | 'amount_home' | 'amount_trading' | 'rate';
type SortDirection = 'asc' | 'desc';

export function AllFundingMovements({ homeCurrency, tradingCurrency }: AllFundingMovementsProps) {
  const [movements, setMovements] = useState<CashMovementWithDirection[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<CashMovementWithDirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMovement, setEditingMovement] = useState<CashMovementWithDirection | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/funding/all-movements?page=1&pageSize=1000`);
      const result = await response.json();
      setMovements(result.data || []);
      setFilteredMovements(result.data || []);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...movements];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => 
        filterType === 'deposit' 
          ? m.direction.direction_code === 'IN'
          : m.direction.direction_code === 'OUT'
      );
    }

    // Filter by transaction date range
    if (dateFrom) {
      filtered = filtered.filter(m => 
        new Date(m.transaction_date) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(m => 
        new Date(m.transaction_date) <= new Date(dateTo)
      );
    }

    // Filter by period range
    if (periodFrom) {
      filtered = filtered.filter(m => {
        if (!m.period_from) return false;
        return new Date(m.period_from) >= new Date(periodFrom);
      });
    }
    if (periodTo) {
      filtered = filtered.filter(m => {
        if (!m.period_to) return false;
        return new Date(m.period_to) <= new Date(periodTo);
      });
    }

    // Filter by search term (notes)
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'date':
          aVal = new Date(a.transaction_date).getTime();
          bVal = new Date(b.transaction_date).getTime();
          break;
        case 'type':
          aVal = a.direction.direction_name;
          bVal = b.direction.direction_name;
          break;
        case 'amount_home':
          aVal = Math.abs(a.home_currency_value);
          bVal = Math.abs(b.home_currency_value);
          break;
        case 'amount_trading':
          aVal = Math.abs(a.trading_currency_value);
          bVal = Math.abs(b.trading_currency_value);
          break;
        case 'rate':
          aVal = a.spot_rate;
          bVal = b.spot_rate;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredMovements(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setCurrentPage(1);
  }, [movements, filterType, searchTerm, dateFrom, dateTo, periodFrom, periodTo, sortField, sortDirection]);

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
    setFilterType('all');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPeriodFrom('');
    setPeriodTo('');
  };

  const hasActiveFilters = filterType !== 'all' || searchTerm || dateFrom || dateTo || periodFrom || periodTo;

  // Paginate filtered results
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-center text-blue-200">Loading transactions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">All Cash Movements</h2>
            <p className="text-xs text-blue-300 mt-1">
              Showing {filteredMovements.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredMovements.length)} of {filteredMovements.length} transactions
            </p>
          </div>
          <GlassButton
            icon={showFilters ? X : Filter}
            onClick={() => setShowFilters(!showFilters)}
            tooltip={showFilters ? 'Hide Filters' : 'Show Filters'}
            variant="primary"
            size="md"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filter by Type */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'deposit' | 'withdrawal')}
                  className="w-full funding-input rounded-xl px-4 py-3"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits Only</option>
                  <option value="withdrawal">Withdrawals Only</option>
                </select>
              </div>

              {/* Search Notes */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Search Notes</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in notes..."
                  className="w-full funding-input rounded-xl px-4 py-3"
                />
              </div>

              {/* Clear All Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="text-blue-200 text-sm font-semibold">Transaction Date Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-blue-200 text-xs mb-2 block">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-blue-200 text-xs mb-2 block">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-blue-200 text-sm font-semibold">Period Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-blue-200 text-xs mb-2 block">From</label>
                    <input
                      type="date"
                      value={periodFrom}
                      onChange={(e) => setPeriodFrom(e.target.value)}
                      className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-blue-200 text-xs mb-2 block">To</label>
                    <input
                      type="date"
                      value={periodTo}
                      onChange={(e) => setPeriodTo(e.target.value)}
                      className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-blue-300 text-sm font-medium">Active filters:</span>
                {filterType !== 'all' && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                    {filterType === 'deposit' ? 'Deposits' : 'Withdrawals'}
                    <button onClick={() => setFilterType('all')}>
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
                {(dateFrom || dateTo) && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                    Transaction Date: {dateFrom || '...'} to {dateTo || '...'}
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(periodFrom || periodTo) && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                    Period: {periodFrom || '...'} to {periodTo || '...'}
                    <button onClick={() => { setPeriodFrom(''); setPeriodTo(''); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th 
                  className="text-left text-blue-200 text-sm font-semibold p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('date')}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-semibold p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('type')}
                >
                  Type {getSortIcon('type')}
                </th>
                <th className="text-left text-blue-200 text-sm font-semibold p-3">Period</th>
                <th 
                  className="text-right text-blue-200 text-sm font-semibold p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('amount_home')}
                >
                  Amount ({homeCurrency}) {getSortIcon('amount_home')}
                </th>
                <th 
                  className="text-right text-blue-200 text-sm font-semibold p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('amount_trading')}
                >
                  Amount ({tradingCurrency}) {getSortIcon('amount_trading')}
                </th>
                <th 
                  className="text-center text-blue-200 text-sm font-semibold p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('rate')}
                >
                  Rate {getSortIcon('rate')}
                </th>
                <th className="text-left text-blue-200 text-sm font-semibold p-3">Notes</th>
                <th className="text-center text-blue-200 text-sm font-semibold p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map((movement) => (
                <tr key={movement.cash_movement_id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white text-sm">
                    {new Date(movement.transaction_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {movement.direction.direction_code === 'IN' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        movement.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {movement.direction.direction_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-blue-200 text-sm">
                    {movement.period_from ? (
                      <>
                        {new Date(movement.period_from).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                        {movement.period_to && (
                          <> - {new Date(movement.period_to).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}</>
                        )}
                      </>
                    ) : (
                      'No period'
                    )}
                  </td>
                  <td className={`p-3 text-right text-sm font-semibold ${
                    movement.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {movement.direction.direction_code === 'IN' ? '+' : '-'}
                    {Math.abs(movement.home_currency_value).toFixed(2)}
                  </td>
                  <td className={`p-3 text-right text-sm font-semibold ${
                    movement.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {movement.direction.direction_code === 'IN' ? '+' : '-'}
                    {Math.abs(movement.trading_currency_value).toFixed(4)}
                  </td>
                  <td className="p-3 text-center text-white text-sm">
                    {movement.spot_rate.toFixed(6)}
                  </td>
                  <td className="p-3 text-white text-sm max-w-xs">
                    {movement.notes ? (
                      <div className="line-clamp-2">
                        <BulletDisplay text={movement.notes} className="text-xs" />
                      </div>
                    ) : (
                      <span className="text-blue-300 italic text-xs">No notes</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setEditingMovement(movement)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="View/Edit"
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

        {filteredMovements.length === 0 && (
          <div className="text-center py-12 text-blue-200">
            {movements.length === 0 
              ? 'No transactions found. Start by recording your first cash movement!'
              : 'No transactions match your filters. Try adjusting your search criteria.'
            }
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMovement && (
        <EditFundingModal
          movement={editingMovement}
          onClose={() => setEditingMovement(null)}
          onSuccess={() => {
            setEditingMovement(null);
            fetchMovements();
          }}
        />
      )}
    </>
  );
}