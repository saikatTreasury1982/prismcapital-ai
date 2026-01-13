'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, List } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import { NewsEntryForm } from './NewsEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByCategoryView } from './ByCategoryView';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';
import { AllNews } from './AllNews';

interface NewsClientWrapperProps {
  newsTypes: NewsType[];
}

export function NewsClientWrapper({ newsTypes }: NewsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'category' | 'all'>('entry');
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
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'ticker', label: 'By Ticker', icon: <List className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'category', label: 'By Category', icon: <BarChart3 className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'all', label: 'All News', icon: <TrendingUp className="w-6 h-6 md:w-5 md:h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'category' | 'all');
            if (tabId === 'entry') {
              setEditingNews(null);
            }
          }}
        />
      </div>

      {/* Content */}
      {activeTab === 'entry' && (
        <div className="max-w-7xl mx-auto">
          <NewsEntryForm 
            newsTypes={newsTypes}
            onSuccess={handleSuccess}
            editingNews={editingNews}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      )}

      {activeTab === 'ticker' && (
        <div className="max-w-7xl mx-auto">
          <ByTickerView 
            key={refreshKey}
            newsTypes={newsTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {activeTab === 'category' && (
        <div className="max-w-7xl mx-auto">
          <ByCategoryView 
            key={refreshKey}
            newsTypes={newsTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {activeTab === 'all' && (
        <div className="max-w-7xl mx-auto">
          <AllNews 
            newsTypes={newsTypes}
            onEdit={handleEdit}
          />
        </div>
      )}
    </div>
  );
}