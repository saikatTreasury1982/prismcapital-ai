'use client';

import { useState } from 'react';
import { Edit3, BarChart3, ArrowLeftRight } from 'lucide-react';
import { UserCurrencies, CashMovementWithDirection, PeriodStats } from '../../lib/types/funding';
import { EntryMethodSelector } from './EntryMethodSelector';
import { QuickEntryForm } from './QuickEntryForm';
import { DetailedEntryForm } from './DetailedEntryForm';
import { PeriodTimeline } from './PeriodTimeline';
import { PeriodCompare } from './PeriodCompare';
import { RecentTransactions } from './RecentTransactions';

interface FundingClientWrapperProps {
  currencies: UserCurrencies;
  movements: CashMovementWithDirection[];
  periodStats: PeriodStats[];
}

export function FundingClientWrapper({ 
  currencies, 
  movements: initialMovements, 
  periodStats: initialPeriodStats 
}: FundingClientWrapperProps) {
  const [viewMode, setViewMode] = useState<'entry' | 'timeline' | 'compare'>('entry');
  const [entryMethod, setEntryMethod] = useState<'quick' | 'detailed' | 'csv'>('quick');

  const handleSuccess = () => {
    // Refresh the page to show new data
    window.location.reload();
  };

  return (
    <div className="min-h-screen funding-gradient-bg p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('entry')}
            className={`px-4 sm:px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              viewMode === 'entry' 
                ? 'funding-emerald-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            <span className="hidden sm:inline">Record Entry</span>
            <span className="sm:hidden">Entry</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 sm:px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              viewMode === 'timeline' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Visual Timeline</span>
            <span className="sm:hidden">Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 sm:px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              viewMode === 'compare' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="hidden sm:inline">Period Compare</span>
            <span className="sm:hidden">Compare</span>
          </button>
        </div>
      </div>

      {/* Entry View */}
      {viewMode === 'entry' && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Entry Method Selection and Forms */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Edit3 className="w-6 h-6" />
              Record Cash Movement
            </h2>
            
            <div className="mb-8">
              <EntryMethodSelector selected={entryMethod} onSelect={setEntryMethod} />
            </div>

            {entryMethod === 'quick' && (
              <QuickEntryForm 
                homeCurrency={currencies.home_currency}
                tradingCurrency={currencies.trading_currency}
                onSuccess={handleSuccess}
              />
            )}

            {entryMethod === 'detailed' && (
              <DetailedEntryForm 
                homeCurrency={currencies.home_currency}
                tradingCurrency={currencies.trading_currency}
                onSuccess={handleSuccess}
              />
            )}

            {entryMethod === 'csv' && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-2xl p-6 border border-purple-400/30 text-center">
                <div className="text-white font-semibold mb-2">CSV Import Coming Soon</div>
                <div className="text-purple-200 text-sm">
                  Bulk import functionality will be available in a future update
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <RecentTransactions 
            movements={initialMovements.slice(0, 5)}
            homeCurrency={currencies.home_currency}
          />
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="max-w-7xl mx-auto">
          <PeriodTimeline 
            periods={initialPeriodStats}
            homeCurrency={currencies.home_currency}
            tradingCurrency={currencies.trading_currency}
          />
        </div>
      )}

      {/* Compare View */}
      {viewMode === 'compare' && (
        <div className="max-w-7xl mx-auto">
          <PeriodCompare 
            periods={initialPeriodStats}
            allMovements={initialMovements}
            homeCurrency={currencies.home_currency}
          />
        </div>
      )}
    </div>
  );
}