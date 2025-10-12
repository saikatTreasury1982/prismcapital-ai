'use client';

import { useState } from 'react';
import { Plus, List, Calendar, TrendingUp } from 'lucide-react';
import { PositionForDividend } from '../../lib/types/dividend';
import { DividendEntryForm } from './DividendEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByQuarterView } from './ByQuarterView';
import { ByYearView } from './ByYearView';

interface DividendsClientWrapperProps {
  positions: PositionForDividend[];
}

export function DividendsClientWrapper({ positions }: DividendsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'quarter' | 'year'>('entry');

  const handleSuccess = () => {
    // Switch to By Ticker tab to see the saved dividend
    setActiveTab('ticker');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'entry' 
                ? 'funding-emerald-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Quick Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ticker')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'ticker' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <List className="w-5 h-5" />
            <span>By Ticker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quarter')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'quarter' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>By Quarter</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('year')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'year' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>By Year</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <DividendEntryForm 
            positions={positions}
            onSuccess={handleSuccess}
          />
        )}

        {activeTab === 'ticker' && <ByTickerView />}

        {activeTab === 'quarter' && <ByQuarterView />}

        {activeTab === 'year' && <ByYearView />}
      </div>
    </div>
  );
}