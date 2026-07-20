'use client';

import { useState } from 'react';
import { Plus, List, BarChart2, Calendar, Download } from 'lucide-react';
import { Transaction } from '../../lib/types/transaction';
import { TransactionEntryForm } from './TransactionEntryForm';
import { ByClosedTradesView } from './ByClosedTradesView';
import { ByOpenTradesView } from './ByOpenTradesView';
import { ByDateView } from './ByDateView';
import { ImportTradesTab } from './ImportTradesTab';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';
import { getPositions } from '../../services/positionServiceClient';
import { Position } from '../../lib/types/transaction';
import { useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function TradesClientWrapper() {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'status' | 'date' | 'import'>('entry');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  const handleSuccess = () => {
    setEditingTransaction(null);
    setEditingTransactionId(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab('entry');
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditingTransactionId(transaction.transaction_id);
    // Already on entry tab, just highlight the row
  };

  const handleDelete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditingTransactionId(null);
  };

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());

  useEffect(() => {
    getPositions(true).then(setPositions).catch(err => console.error('Failed to fetch positions:', err));
  }, [refreshKey]);

  const togglePositionExpansion = (positionId: number) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      next.has(positionId) ? next.delete(positionId) : next.add(positionId);
      return next;
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <UnderlineTabs
          tabs={[
            { id: 'import', label: 'Import Trades', icon: <Download className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'ticker', label: 'Closed Trades', icon: <List className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'status', label: 'Open Trades', icon: <BarChart2 className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'date', label: 'By Date', icon: <Calendar className="w-6 h-6 md:w-5 md:h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'status' | 'date' | 'import');
            if (tabId === 'entry') {
              setEditingTransaction(null);
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Positions List (30%) */}
            <div className="lg:w-[30%]">
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Your Positions</h2>
                {positions.length === 0 ? (
                  <p className="text-blue-200 text-sm text-center py-8">No active positions found</p>
                ) : (
                  <div className="space-y-3">
                    {positions
                      .sort((a, b) => {
                        if (selectedPosition?.position_id === a.position_id) return -1;
                        if (selectedPosition?.position_id === b.position_id) return 1;
                        return 0;
                      })
                      .map((position) => {
                        const isExpanded = expandedPositions.has(position.position_id);
                        return (
                          <div
                            key={position.position_id}
                            onClick={() => setSelectedPosition(position)}
                            className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${selectedPosition?.position_id === position.position_id
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePositionExpansion(position.position_id);
                                  }}
                                  className="p-1 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all flex-shrink-0"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <h3 className="text-white font-bold text-lg truncate">{position.ticker}</h3>
                              </div>
                              <span className="text-blue-200 text-xs flex-shrink-0">{position.position_currency}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-blue-300">Shares</p>
                                <p className="text-white font-semibold">{position.total_shares.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-blue-300">Value</p>
                                <p className="text-white font-semibold">${position.current_value?.toFixed(2) || 'N/A'}</p>
                              </div>
                            </div>
                            {isExpanded && (
                              <>
                                {position.ticker_name && (
                                  <p className="text-blue-300 text-xs mt-2">{position.ticker_name}</p>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                  <div>
                                    <p className="text-blue-300">Avg Cost</p>
                                    <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-blue-300">Current Price</p>
                                    <p className="text-white font-semibold">${position.current_market_price?.toFixed(2) || 'N/A'}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* GRADIENT DIVIDER */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3" />

            {/* Right Panel - Entry Form (70%) */}
            <div className="lg:w-[70%] backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
              <TransactionEntryForm
                onSuccess={handleSuccess}
                editingTransaction={editingTransaction}
                onCancelEdit={handleCancelEdit}
                selectedPosition={selectedPosition}
                onClearSelection={() => setSelectedPosition(null)}
                refreshKey={refreshKey}
              />
            </div>
          </div>
        )}

        {activeTab === 'ticker' && (
          <ByClosedTradesView
            key={refreshKey}
          />
        )}

        {activeTab === 'status' && (
          <ByOpenTradesView
            key={refreshKey}
          />
        )}

        {activeTab === 'date' && (
          <ByDateView
            key={refreshKey}
          />
        )}

        {activeTab === 'import' && (
          <ImportTradesTab />
        )}
      </div>
    </div>
  );
}