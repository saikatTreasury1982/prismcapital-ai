'use client';

import { useState, useRef } from 'react';
import { Edit3, BarChart3, ArrowLeftRight, Save, RefreshCw, Plus, List } from 'lucide-react';
import { UserCurrencies, CashMovementWithDirection, PeriodStats } from '../../lib/types/funding';
import { DetailedEntryForm, DetailedEntryFormRef } from './DetailedEntryForm';
import { PeriodTimeline } from './PeriodTimeline';
import { PeriodCompare } from './PeriodCompare';
import { RecentTransactions } from './RecentTransactions';
import UnderlineTabs from '@/app/lib/ui/UnderlineTabs';
import GlassButton from '@/app/lib/ui/GlassButton';
import { AllFundingMovements } from './AllFundingMovements';

interface FundingClientWrapperProps {
  currencies: UserCurrencies;
  movements: CashMovementWithDirection[];
  periodStats: PeriodStats[];
}

export function FundingClientWrapper({
  currencies,
  movements: initialMovements,
  periodStats: initialPeriodStats
}: FundingClientWrapperProps) {
  const [viewMode, setViewMode] = useState<'entry' | 'timeline' | 'compare' | 'all'>('entry');
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const formRef = useRef<DetailedEntryFormRef>(null);

  const handleSuccess = () => {
    setEditingTransactionId(null);
    window.location.reload();
  };

  const handleTransactionClick = (transaction: CashMovementWithDirection) => {
    setEditingTransactionId(transaction.cash_movement_id);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <UnderlineTabs
          tabs={[
            { id: 'entry', label: 'Record Entry', icon: <Edit3 className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'timeline', label: 'Visual Timeline', icon: <BarChart3 className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'compare', label: 'Period Compare', icon: <ArrowLeftRight className="w-6 h-6 md:w-5 md:h-5" /> },
            { id: 'all', label: 'All Transactions', icon: <List className="w-6 h-6 md:w-5 md:h-5" /> },
          ]}
          activeTab={viewMode}
          onChange={(tabId) => setViewMode(tabId as 'entry' | 'timeline' | 'compare' | 'all')}
        />
      </div>

      {/* Entry View */}
      {viewMode === 'entry' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Entry Form */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 sm:p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Record Cash Movement
                </h2>
                <p className="text-xs text-blue-300 mt-1">* Required fields</p>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  icon={Save}
                  onClick={() => formRef.current?.handleSubmit()}
                  disabled={isSubmitting || !canSubmit}
                  tooltip="Save Transaction"
                  variant="primary"
                  size="sm"
                />
                <GlassButton
                  icon={RefreshCw}
                  onClick={() => formRef.current?.handleCancel()}
                  tooltip="Reset Form"
                  variant="secondary"
                  size="sm"
                />
              </div>
            </div>

            <DetailedEntryForm
              ref={formRef}
              homeCurrency={currencies.home_currency}
              tradingCurrency={currencies.trading_currency}
              onSuccess={handleSuccess}
              onValidationChange={setCanSubmit}
              onSubmittingChange={setIsSubmitting}
              editingTransaction={initialMovements.find(m => m.cash_movement_id === editingTransactionId) || null}
              onCancelEdit={() => setEditingTransactionId(null)}
            />
          </div>

          {/* Recent Transactions */}
          <RecentTransactions
            movements={initialMovements.slice(0, 5)}
            homeCurrency={currencies.home_currency}
            onTransactionClick={handleTransactionClick}
            editingTransactionId={editingTransactionId}
          />
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="max-w-7xl mx-auto">
          <PeriodTimeline
            periods={initialPeriodStats}
            homeCurrency={currencies.home_currency}
            tradingCurrency={currencies.trading_currency}
          />
        </div>
      )}

      {/* Compare View */}
      {viewMode === 'compare' && (
        <div className="max-w-7xl mx-auto">
          <PeriodCompare
            periods={initialPeriodStats}
            allMovements={initialMovements}
            home_currency={currencies.home_currency}
          />
        </div>
      )}

      {/* All Transactions View */}
      {viewMode === 'all' && (
        <div className="max-w-7xl mx-auto">
          <AllFundingMovements
            homeCurrency={currencies.home_currency}
            tradingCurrency={currencies.trading_currency}
          />
        </div>
      )}
    </div>
  );
}