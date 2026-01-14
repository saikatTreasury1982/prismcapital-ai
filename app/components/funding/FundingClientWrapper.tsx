'use client';

import { useState, useRef } from 'react';
import { Edit3, BarChart3, ArrowLeftRight, Save, XCircle, Plus, List } from 'lucide-react';
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
  const formRef = useRef<DetailedEntryFormRef>(null);

  const handleSuccess = () => {
    window.location.reload();
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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Form */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    Record Cash Movement
                  </h2>
                  <p className="text-xs text-blue-300 mt-1">* Required fields</p>
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    icon={XCircle}
                    onClick={() => formRef.current?.handleCancel()}
                    tooltip="Clear Form"
                    variant="secondary"
                    size="md"
                  />
                  <GlassButton
                    icon={Save}
                    onClick={() => formRef.current?.handleSubmit()}
                    disabled={!formRef.current || formRef.current.isSubmitting || !formRef.current.canSubmit}
                    tooltip="Save Transaction"
                    variant="primary"
                    size="md"
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
              />
            </div>

            {/* Recent Transactions */}
            <div>
              <RecentTransactions 
                movements={initialMovements.slice(0, 5)}
                homeCurrency={currencies.home_currency}
              />
            </div>
          </div>
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