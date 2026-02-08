'use client';

import { useState } from 'react';
import { Plus, List, BarChart2, Calendar, Download } from 'lucide-react';
import { RecentTransactionsList } from './RecentTransactionsList';
import { Transaction } from '../../lib/types/transaction';
import { TransactionEntryForm } from './TransactionEntryForm';
import { ByClosedTradesView } from './ByClosedTradesView';
import { ByOpenTradesView } from './ByOpenTradesView';
import { ByDateView } from './ByDateView';
import { ImportTradesTab } from './ImportTradesTab';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';

export function TradesClientWrapper() {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'status' | 'date' | 'import'>('entry');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);

  const handleSuccess = () => {
    setEditingTransaction(null);
    setEditingTransactionId(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab('entry');
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditingTransactionId(transaction.transaction_id);
    // Already on entry tab, just highlight the row
  };

  const handleDelete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditingTransactionId(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <UnderlineTabs
          tabs={[
            { id: 'import', label: 'Import Trades', icon: <Download className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'entry', label: 'Quick Entry', icon: <Plus className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'ticker', label: 'Closed Trades', icon: <List className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'status', label: 'Open Trades', icon: <BarChart2 className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'date', label: 'By Date', icon: <Calendar className="w-6 h-6 md:w-5 md:h-5" /> },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId as 'entry' | 'ticker' | 'status' | 'date' | 'import');
            if (tabId === 'entry') {
              setEditingTransaction(null);
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Entry Form */}
            <div className="flex-1 backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
              <TransactionEntryForm 
                onSuccess={handleSuccess}
                editingTransaction={editingTransaction}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* GRADIENT DIVIDER */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3" />

            {/* Recent Transactions */}
            <div className="flex-1">
              <RecentTransactionsList 
                refreshKey={refreshKey}
                onTransactionClick={handleTransactionClick}
                editingTransactionId={editingTransactionId}
              />
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

        {activeTab === 'import' && (
          <ImportTradesTab />
        )}
      </div>
    </div>
  );
}