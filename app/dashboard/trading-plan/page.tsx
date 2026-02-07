'use client';

import { useState } from 'react';
import { Target, LineChart, ListCheckIcon, ListPlusIcon } from 'lucide-react';
import { TradeAnalyzer } from '@/app/components/trading-plan/TradeAnalyzer';
import { PositionActions } from '@/app/components/trading-plan/PositionActions';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';

export default function TradingPlanPage() {
  const [activeTab, setActiveTab] = useState<'actions' | 'analyzer'>('analyzer');

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Trading Plan</h1>
        <p className="text-blue-200">Plan your position actions and analyze trade opportunities</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <SegmentedPills
          options={[
            { value: 1, label: 'Position Actions', icon: <ListCheckIcon className="w-5 h-5" />, activeColor: 'bg-emerald-500' },
            { value: 2, label: 'Trade Actions', icon: <LineChart className="w-5 h-5" />, activeColor: 'bg-indigo-500' },
          ]}
          value={activeTab === 'actions' ? 1 : 2}
          onChange={(value) => setActiveTab(value === 1 ? 'actions' : 'analyzer')}
          showLabels={true}
          className="inline-flex"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'actions' && <PositionActions />}
      {activeTab === 'analyzer' && <TradeAnalyzer />}
    </div>
  );
}