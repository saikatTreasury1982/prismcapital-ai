'use client';

import { useState } from 'react';
import { Plus, List, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { PositionForDividend, Dividend } from '../../lib/types/dividend';
import { DividendEntryForm } from './DividendEntryForm';
import { RecentDividendsList } from './RecentDividendsList';
import { ByTickerView } from './ByTickerView';
import { ByQuarterView } from './ByQuarterView';
import { ByYearView } from './ByYearView';
import { UpcomingView } from './UpcomingView';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';

interface DividendsClientWrapperProps {
  positions: PositionForDividend[];
}

export function DividendsClientWrapper({ positions }: DividendsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'quarter' | 'year' | 'upcoming'>('entry');
  const [editingDividend, setEditingDividend] = useState<Dividend | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedPosition, setSelectedPosition] = useState<PositionForDividend | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());

  const togglePositionExpansion = (positionId: number) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      next.has(positionId) ? next.delete(positionId) : next.add(positionId);
      return next;
    });
  };

  const handleSuccess = () => {
    setEditingDividend(null);
    setSelectedPosition(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (dividend: Dividend) => {
    setEditingDividend(dividend);
    setActiveTab('entry');
  };

  const handleDelete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingDividend(null);
    setSelectedPosition(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <UnderlineTabs
            tabs={[
              { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-6 h-6 md:w-5 md:h-5" /> },
              { id: 'ticker', label: 'By Ticker', icon: <List className="w-6 h-6 md:w-5 md:h-5" /> },
              { id: 'quarter', label: 'By Quarter', icon: <Calendar className="w-6 h-6 md:w-5 md:h-5" /> },
              { id: 'year', label: 'By Year', icon: <TrendingUp className="w-6 h-6 md:w-5 md:h-5" /> },
              { id: 'upcoming', label: 'Upcoming', icon: <Calendar className="w-6 h-6 md:w-5 md:h-5" /> },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => {
              setActiveTab(tabId as 'entry' | 'ticker' | 'quarter' | 'year' | 'upcoming');
              if (tabId === 'entry') {
                setEditingDividend(null);
              }
            }}
          />
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'entry' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT PANEL - Positions List (30%) */}
              <div className="lg:w-[30%]">
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-4">Open Positions</h2>
                  {positions.length === 0 ? (
                    <p className="text-blue-200 text-sm text-center py-8">No open positions found</p>
                  ) : (
                    <div className="space-y-3">
                      {positions.map((position) => {
                        const isExpanded = expandedPositions.has(position.position_id);
                        const isSelected = selectedPosition?.position_id === position.position_id;
                        const isThisLoading = loadingTicker === position.ticker;
                        const isDimmed = isAutoFilling && !isThisLoading;
                        return (
                          <div
                            key={position.position_id}
                            onClick={() => !isAutoFilling && setSelectedPosition(position)}
                            className={`w-full text-left p-4 rounded-xl transition-all relative ${
                              isDimmed ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-400'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            } ${isThisLoading ? 'border-emerald-400 animate-pulse' : ''}`}
                          >
                            {isThisLoading && (
                              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
                                <svg className="animate-spin h-6 w-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                              </div>
                            )}

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
                              <span className="text-blue-200 text-xs flex-shrink-0">USD</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-blue-300">Shares</p>
                                <p className="text-white font-semibold">{position.total_shares.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-blue-300">Avg Cost</p>
                                <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                {position.ticker_name && (
                                  <p className="text-blue-300 text-xs mt-2">{position.ticker_name}</p>
                                )}
                                {position.current_market_price && (
                                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                    <div>
                                      <p className="text-blue-300">Market</p>
                                      <p className="text-white font-semibold">${position.current_market_price.toFixed(2)}</p>
                                    </div>
                                  </div>
                                )}
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

              {/* RIGHT PANEL - Form over Recent Dividends (70%) */}
              <div className="lg:w-[70%] space-y-6">
                <DividendEntryForm
                  positions={positions}
                  onSuccess={handleSuccess}
                  editingDividend={editingDividend}
                  onCancelEdit={handleCancelEdit}
                  selectedPosition={selectedPosition}
                  onAutoFillingChange={setIsAutoFilling}
                  onLoadingTickerChange={setLoadingTicker}
                />

                <RecentDividendsList
                  refreshKey={refreshKey}
                  onDividendClick={handleEdit}
                  editingDividendId={editingDividend?.dividend_id ?? null}
                />
              </div>
            </div>
          )}

          {activeTab === 'ticker' && (
            <ByTickerView key={refreshKey} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          {activeTab === 'quarter' && (
            <ByQuarterView key={refreshKey} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          {activeTab === 'year' && (
            <ByYearView key={refreshKey} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          {activeTab === 'upcoming' && <UpcomingView key={refreshKey} />}
        </div>
      </div>
    </div>
  );
}