'use client';

import { useState } from 'react';
import { Edit3, BarChart3, ArrowLeftRight } from 'lucide-react';
import { UserCurrencies, CashMovementWithDirection, PeriodStats } from '../../lib/types/funding';
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

  const handleSuccess = () => {
    // Refresh the page to show new data
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
    {/* Navigation Tabs */}
    <div className="max-w-7xl mx-auto mb-6">
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode('entry')}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            viewMode === 'entry' 
              ? 'funding-emerald-gradient text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <Edit3 className="w-5 h-5" />
          <span>Record Entry</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('timeline')}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            viewMode === 'timeline' 
              ? 'funding-blue-gradient text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Visual Timeline</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('compare')}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            viewMode === 'compare' 
              ? 'funding-blue-gradient text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Period Compare</span>
        </button>
      </div>
    </div>

      {/* Entry View */}
      {/* Entry View */}
      {viewMode === 'entry' && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Edit3 className="w-6 h-6" />
                Record Cash Movement
              </h2>
              
              <DetailedEntryForm 
                homeCurrency={currencies.home_currency}
                tradingCurrency={currencies.trading_currency}
                onSuccess={handleSuccess}
              />
            </div>

            {/* Recent Transactions */}
            <div>
              <RecentTransactions 
                movements={initialMovements.slice(0, 5)}
                homeCurrency={currencies.home_currency}
              />
            </div>
          </div>
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
            home_currency={currencies.home_currency}
          />
        </div>
      )}
    </div>
  );
}