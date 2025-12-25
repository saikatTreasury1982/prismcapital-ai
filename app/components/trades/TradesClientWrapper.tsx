'use client';

import { useState } from 'react';
import { Plus, List, BarChart2, Calendar } from 'lucide-react';
import { RecentTransactionsList } from './RecentTransactionsList';
import { Transaction } from '../../lib/types/transaction';
import { TransactionEntryForm } from './TransactionEntryForm';
import { ByClosedTradesView } from './ByClosedTradesView';
import { ByOpenTradesView } from './ByOpenTradesView';
import { ByDateView } from './ByDateView';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';

export function TradesClientWrapper() {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'status' | 'date'>('entry');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setEditingTransaction(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab('entry');
  };

  const handleDelete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <UnderlineTabs
          tabs={[
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-5 h-5" /> },
            { id: 'ticker', label: 'Closed Trades', icon: <List className="w-5 h-5" /> },
            { id: 'status', label: 'Open Trades', icon: <BarChart2 className="w-5 h-5" /> },
            { id: 'date', label: 'By Date', icon: <Calendar className="w-5 h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'status' | 'date');
            if (tabId === 'entry') {
              setEditingTransaction(null);
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <div>
              <TransactionEntryForm 
                onSuccess={handleSuccess}
                editingTransaction={editingTransaction}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* Recent Transactions */}
            <div>
              <RecentTransactionsList refreshKey={refreshKey} />
            </div>
          </div>
        )}

        {activeTab === 'ticker' && (
          <ByClosedTradesView 
            key={refreshKey}
          />
        )}

        {activeTab === 'status' && (
          <ByOpenTradesView 
            key={refreshKey}
          />
        )}

        {activeTab === 'date' && (
          <ByDateView 
            key={refreshKey}
          />
        )}
      </div>
    </div>
  );
}