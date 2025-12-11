'use client';

import { useState } from 'react';
import { Plus, List, Calendar, TrendingUp } from 'lucide-react';
import { PositionForDividend, Dividend } from '../../lib/types/dividend';
import { DividendEntryForm } from './DividendEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByQuarterView } from './ByQuarterView';
import { ByYearView } from './ByYearView';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';

interface DividendsClientWrapperProps {
  positions: PositionForDividend[];
}

export function DividendsClientWrapper({ positions }: DividendsClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'quarter' | 'year'>('entry');
  const [editingDividend, setEditingDividend] = useState<Dividend | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setEditingDividend(null);
    setRefreshKey(prev => prev + 1);
    setActiveTab('ticker');
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
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <UnderlineTabs
          tabs={[
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-5 h-5" /> },
            { id: 'ticker', label: 'By Ticker', icon: <List className="w-5 h-5" /> },
            { id: 'quarter', label: 'By Quarter', icon: <Calendar className="w-5 h-5" /> },
            { id: 'year', label: 'By Year', icon: <TrendingUp className="w-5 h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'quarter' | 'year');
            if (tabId === 'entry') {
              setEditingDividend(null);
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <DividendEntryForm 
            positions={positions}
            onSuccess={handleSuccess}
            editingDividend={editingDividend}
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

        {activeTab === 'quarter' && (
          <ByQuarterView 
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'year' && (
          <ByYearView 
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}