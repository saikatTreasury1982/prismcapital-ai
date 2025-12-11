'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, List } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import { NewsEntryForm } from './NewsEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByCategoryView } from './ByCategoryView';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';

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
        <UnderlineTabs
          tabs={[
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-5 h-5" /> },
            { id: 'ticker', label: 'By Ticker', icon: <List className="w-5 h-5" /> },
            { id: 'category', label: 'By Category', icon: <BarChart3 className="w-5 h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'category');
            if (tabId === 'entry') {
              setEditingNews(null);
            }
          }}
        />
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