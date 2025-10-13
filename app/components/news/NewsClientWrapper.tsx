'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, List } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import { NewsEntryForm } from './NewsEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByCategoryView } from './ByCategoryView';

interface NewsClientWrapperProps {
  newsTypes: NewsType[];
}

export function NewsClientWrapper({ newsTypes }: NewsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'category'>('entry');
  const [editingNews, setEditingNews] = useState<NewsListItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setEditingNews(null);
    setRefreshKey(prev => prev + 1);
    setActiveTab('ticker');
  };

  const handleEdit = (news: NewsListItem) => {
    setEditingNews(news);
    setActiveTab('entry');
  };

  const handleDelete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingNews(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('entry');
              setEditingNews(null);
            }}
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
            editingNews={editingNews}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === 'ticker' && (
          <ByTickerView 
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'category' && (
          <ByCategoryView 
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}