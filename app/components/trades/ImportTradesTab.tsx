'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, FilterX, X, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Eye, CheckSquare, Square, RefreshCw } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { TransactionEntryForm } from './TransactionEntryForm';
import { StagingRecord } from '@/app/lib/types/moomoo';
import { MoomooSyncControls } from './MoomooSyncControls';


export function ImportTradesTab() {
  const [stagingRecords, setStagingRecords] = useState<StagingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StagingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStagingRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moomoo/staging');
      const data = await response.json();
      setStagingRecords(data.data || []);
      setFilteredRecords(data.data || []);
      
      // Extract unique tickers
      const tickers = Array.from(new Set(data.data.map((r: StagingRecord) => r.ticker))) as string[];
      setUniqueTickers(tickers.sort());
    } catch (error) {
      console.error('Failed to fetch staging records:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTicker, setSelectedTicker] = useState<string>('all');
  const [uniqueTickers, setUniqueTickers] = useState<string[]>([]);
  
  // Sort state
  type SortField = 'ticker' | 'transaction_date' | 'quantity' | 'price' | 'fees' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modal state
  const [viewingRecord, setViewingRecord] = useState<StagingRecord | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/moomoo/connection');
        const data = await response.json();
        setConnectionStatus(data.connected ? 'online' : 'offline');
      } catch (error) {
        setConnectionStatus('offline');
      }
    };
    
    checkConnection();
  }, []);

  // Fetch staging records on mount
  useEffect(() => {
    fetchStagingRecords();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...stagingRecords];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }

    // Filter by ticker
    if (selectedTicker !== 'all') {
      filtered = filtered.filter(r => r.ticker === selectedTicker);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'transaction_date':
          aVal = new Date(a.transaction_date).getTime();
          bVal = new Date(b.transaction_date).getTime();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'fees':
          aVal = a.fees;
          bVal = b.fees;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [selectedStatus, selectedTicker, sortField, sortDirection, stagingRecords]);

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
    setSelectedStatus('all');
    setSelectedTicker('all');
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedTicker !== 'all';

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map(r => r.staging_id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleViewEdit = (record: StagingRecord) => {
    setViewingRecord(record);
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await fetch(`/api/moomoo/staging/${id}`, {
        method: 'DELETE'
      });
      fetchStagingRecords(); // ✅ Only refresh table data
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record');
    }
  };

  const handleClearRejected = async () => {
    if (!confirm('Clear all rejected records?')) return;
    
    try {
      await fetch('/api/moomoo/staging/clear-rejected', {
        method: 'DELETE'
      });
      fetchStagingRecords(); // ✅ Only refresh table data
    } catch (error) {
      console.error('Failed to clear rejected:', error);
      alert('Failed to clear rejected records');
    }
  };

  const handleReleaseSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Please select records to release');
      return;
    }
    
    if (!confirm(`Release ${selectedIds.length} selected record(s)?`)) return;
    
    try {
      const response = await fetch('/api/moomoo/staging/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagingIds: selectedIds })
      });
      
      const data = await response.json();
      
      alert(`Released: ${data.summary.success}\nFailed: ${data.summary.failed}`);
      
      setSelectedIds([]);
      fetchStagingRecords(); // ✅ Only refresh table data
    } catch (error) {
      console.error('Failed to release records:', error);
      alert('Failed to release records');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'imported':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">📥 Imported</span>;
      case 'edited':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">✏️ Edited</span>;
      case 'rejected_duplicate':
        return <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">❌ Duplicate</span>;
      case 'rejected_error':
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs">⚠️ Error</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">{status}</span>;
    }
  };

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = stagingRecords.filter(r => r.status === 'imported' || r.status === 'edited').length;
  const rejectedCount = stagingRecords.filter(r => r.status.startsWith('rejected')).length;

  return (
    <div className="space-y-6">
      {/* Connection Status Bar */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                loading ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'online' ? 'bg-green-500' : 
                connectionStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-500 animate-pulse'
              }`} />
              <span className="text-white font-medium">
                {loading ? 'Loading...' :
                  connectionStatus === 'online' ? 'Moomoo OpenD: Connected' : 
                  connectionStatus === 'offline' ? 'Moomoo OpenD: Disconnected' : 
                  'Moomoo OpenD: Checking...'
                }
              </span>
            </div>
            {!loading && (
              <div className="text-blue-200 text-sm">
                Port: 33333
              </div>
            )}
          </div>
          
          {!loading && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-300">Pending: {pendingCount}</span>
              <span className="text-red-300">Rejected: {rejectedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Moomoo Sync Controls - Always mounted */}
      <MoomooSyncControls onSyncComplete={fetchStagingRecords} />

      {/* Main Table */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
        {loading ? (
          /* Loading State */
          <div className="flex items-center justify-center gap-3 p-8">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-blue-200">Loading staged trades...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Staged Trades</h2>
                <p className="text-xs text-blue-300 mt-1">
                  Showing {filteredRecords.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0}-{Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  icon={showFilters ? X : Filter}
                  onClick={() => setShowFilters(!showFilters)}
                  tooltip={showFilters ? 'Hide Filters' : 'Show Filters'}
                  variant="primary"
                  size="sm"
                />
                {rejectedCount > 0 && (
                  <GlassButton
                    icon={Trash2}
                    onClick={handleClearRejected}
                    tooltip="Clear Rejected Records"
                    variant="secondary"
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-blue-200 text-sm mb-2 block font-medium">Filter by Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full funding-input rounded-xl px-4 py-2 text-sm"
                    >
                      <option value="all" className="bg-slate-800 text-white">All Status</option>
                      <option value="imported" className="bg-slate-800 text-white">Imported</option>
                      <option value="edited" className="bg-slate-800 text-white">Edited</option>
                      <option value="rejected_duplicate" className="bg-slate-800 text-white">Duplicate</option>
                      <option value="rejected_error" className="bg-slate-800 text-white">Error</option>
                    </select>
                  </div>

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

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-blue-300 text-sm font-medium">Active filters:</span>
                    {selectedStatus !== 'all' && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                        Status: {selectedStatus}
                        <button onClick={() => setSelectedStatus('all')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedTicker !== 'all' && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm flex items-center gap-2">
                        Ticker: {selectedTicker}
                        <button onClick={() => setSelectedTicker('all')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-400/30 flex items-center justify-between">
                <span className="text-blue-200 text-sm">
                  {selectedIds.length} record(s) selected
                </span>
                <GlassButton
                  icon={CheckSquare}
                  onClick={handleReleaseSelected}
                  tooltip={`Release ${selectedIds.length} Selected`}
                  variant="primary"
                  size="sm"
                >
                </GlassButton>
              </div>
            )}

            {/* Table */}
            {paginatedRecords.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-blue-200">No staged trades found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-2">
                          <button onClick={handleSelectAll} className="p-1 hover:bg-white/10 rounded">
                            {selectedIds.length === paginatedRecords.length ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        </th>
                        <th 
                          className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          Status {getSortIcon('status')}
                        </th>
                        <th 
                          className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('ticker')}
                        >
                          Ticker {getSortIcon('ticker')}
                        </th>
                        <th 
                          className="text-left text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('transaction_date')}
                        >
                          Date {getSortIcon('transaction_date')}
                        </th>
                        <th className="text-left text-blue-200 p-2 font-semibold">
                          Type
                        </th>
                        <th 
                          className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('quantity')}
                        >
                          Quantity {getSortIcon('quantity')}
                        </th>
                        <th 
                          className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('price')}
                        >
                          Price {getSortIcon('price')}
                        </th>
                        <th 
                          className="text-right text-blue-200 p-2 font-semibold cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('fees')}
                        >
                          Fees {getSortIcon('fees')}
                        </th>
                        <th className="text-left text-blue-200 p-2 font-semibold">
                          Strategy
                        </th>
                        <th className="text-center text-blue-200 p-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((record) => (
                        <tr 
                          key={record.staging_id} 
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-2">
                            <button 
                              onClick={() => handleSelectOne(record.staging_id)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              {selectedIds.includes(record.staging_id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </td>
                          <td className="p-2">{getStatusBadge(record.status)}</td>
                          <td className="p-2 text-white font-semibold">{record.ticker}</td>
                          <td className="p-2 text-white">
                            {new Date(record.transaction_date).toLocaleDateString('en-GB', { 
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              record.transaction_type_id === 1 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {record.transaction_type_id === 1 ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="p-2 text-right text-white">{record.quantity.toFixed(3)}</td>
                          <td className="p-2 text-right text-white">${record.price.toFixed(2)}</td>
                          <td className="p-2 text-right text-white">${record.fees.toFixed(2)}</td>
                          <td className="p-2 text-white text-xs">
                            {record.strategy_code || (
                              <span className="text-yellow-300 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewEdit(record)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="View/Edit"
                              >
                                <Eye className="w-4 h-4 text-blue-300" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.staging_id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-300" />
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
          </>
        )}
      </div>

      {/* Edit Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TransactionEntryForm
              mode="staging"
              stagingRecord={viewingRecord}
              onSuccess={() => {
                setViewingRecord(null);
                fetchStagingRecords();
              }}
              onCancelEdit={() => setViewingRecord(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}