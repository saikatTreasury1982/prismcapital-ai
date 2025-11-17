'use client';

import { useState } from 'react';
import { Target, LineChart } from 'lucide-react';
import { TradeAnalyzer } from '@/app/components/trading-plan/TradeAnalyzer';

export default function TradingPlanPage() {
  const [activeTab, setActiveTab] = useState<'actions' | 'analyzer'>('analyzer');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Trading Plan</h1>
        <p className="text-blue-200">Plan your position actions and analyze trade opportunities</p>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'actions' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Position Actions</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analyzer')}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'analyzer' 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
              : 'text-blue-200 hover:bg-white/5'
          }`}
        >
          <LineChart className="w-5 h-5" />
          <span>Trade Analyzer</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'actions' && (
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
          <p className="text-blue-200 text-center">Position Actions - Coming Soon</p>
        </div>
      )}

      {activeTab === 'analyzer' && <TradeAnalyzer />}
    </div>
  );
}