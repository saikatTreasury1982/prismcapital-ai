'use client';

import { useState } from 'react';
import { Plus, List, BarChart2, Calendar } from 'lucide-react';
import { Transaction, TradeLot } from '../../lib/types/transaction';
import { TransactionEntryForm } from './TransactionEntryForm';
import { ByTickerView } from './ByTickerView';
import { ByStatusView } from './ByStatusView';
import { ByDateView } from './ByDateView';

export function TradesClientWrapper() {
  const [activeTab, setActiveTab] = useState<'entry' | 'ticker' | 'status' | 'date'>('entry');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setEditingTransaction(null);
    setRefreshKey(prev => prev + 1);
    setActiveTab('ticker');
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
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10 inline-flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('entry');
              setEditingTransaction(null);
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
            onClick={() => setActiveTab('status')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'status' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>By Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('date')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'date' 
                ? 'funding-blue-gradient text-white shadow-lg' 
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>By Date</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'entry' && (
          <TransactionEntryForm 
            onSuccess={handleSuccess}
            editingTransaction={editingTransaction}
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

        {activeTab === 'status' && (
          <ByStatusView 
            key={refreshKey}
          />
        )}

        {activeTab === 'date' && (
          <ByDateView 
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}