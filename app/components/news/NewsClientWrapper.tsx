'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, List } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsEntryForm } from './NewsEntryForm';

interface NewsClientWrapperProps {
  newsTypes: NewsType[];
}

export function NewsClientWrapper({ newsTypes }: NewsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'earnings' | 'general' | 'category'>('entry');

  const handleSuccess = () => {
    // Use Next.js router for proper refresh
    window.location.href = window.location.pathname;
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
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'earnings' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Earnings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'general' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <span className="text-lg">📰</span>
            <span>General</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'category' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>By Category</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <NewsEntryForm 
            newsTypes={newsTypes}
            onSuccess={handleSuccess}
          />
        )}

        {activeTab === 'ticker' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">News by Ticker</h2>
            <p className="text-blue-200">Coming soon...</p>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Earnings News</h2>
            <p className="text-blue-200">Coming soon...</p>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">General News</h2>
            <p className="text-blue-200">Coming soon...</p>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">News by Category</h2>
            <p className="text-blue-200">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}