'use client';

import { useState } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';
import { PeriodStats } from '../../lib/types/funding';
import { CashMovementWithDirection } from '../../lib/types/funding';

interface PeriodCompareProps {
  periods: PeriodStats[];
  allMovements: CashMovementWithDirection[];
  homeCurrency: string;
}

export function PeriodCompare({ periods, allMovements, homeCurrency }: PeriodCompareProps) {
  const [selectedPeriod1, setSelectedPeriod1] = useState(periods[0]?.period || '');
  const [selectedPeriod2, setSelectedPeriod2] = useState(periods[periods.length - 1]?.period || '');

  if (periods.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6" />
          Period Comparison
        </h2>
        <div className="text-center py-12 text-blue-200">
          Need at least 2 periods to compare. Start recording transactions!
        </div>
      </div>
    );
  }

  const stats1 = periods.find(p => p.period === selectedPeriod1) || periods[0];
  const stats2 = periods.find(p => p.period === selectedPeriod2) || periods[periods.length - 1];

  const movements1 = allMovements.filter(m => m.period_from === selectedPeriod1);
  const movements2 = allMovements.filter(m => m.period_from === selectedPeriod2);

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <ArrowLeftRight className="w-6 h-6" />
        Period Comparison
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Period 1 */}
        <div className="space-y-4">
          <select 
            value={selectedPeriod1}
            onChange={(e) => setSelectedPeriod1(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {periods.map(p => (
              <option key={p.period} value={p.period}>
                {new Date(p.period).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </option>
            ))}
          </select>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 border border-blue-400/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Inflow</span>
              <span className="text-emerald-300 text-xl font-bold">
                {homeCurrency} {stats1.inflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Outflow</span>
              <span className="text-rose-300 text-xl font-bold">
                {homeCurrency} {stats1.outflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/20">
              <span className="text-white font-semibold">Net Flow</span>
              <span className={`text-2xl font-bold ${stats1.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {homeCurrency} {stats1.net_flow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-200">Transactions</span>
              <span className="text-white">{stats1.transaction_count}</span>
            </div>
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {movements1.map(txn => (
              <div key={txn.cash_movement_id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">
                    {new Date(txn.transaction_date).toLocaleDateString()}
                  </span>
                  <span className={`font-semibold ${txn.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {txn.direction.direction_code === 'IN' ? '+' : '-'}{homeCurrency} {Math.abs(txn.home_currency_value).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Period 2 */}
        <div className="space-y-4">
          <select 
            value={selectedPeriod2}
            onChange={(e) => setSelectedPeriod2(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {periods.map(p => (
              <option key={p.period} value={p.period}>
                {new Date(p.period).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </option>
            ))}
          </select>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 border border-purple-400/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Inflow</span>
              <span className="text-emerald-300 text-xl font-bold">
                {homeCurrency} {stats2.inflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Outflow</span>
              <span className="text-rose-300 text-xl font-bold">
                {homeCurrency} {stats2.outflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/20">
              <span className="text-white font-semibold">Net Flow</span>
              <span className={`text-2xl font-bold ${stats2.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {homeCurrency} {stats2.net_flow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-purple-200">Transactions</span>
              <span className="text-white">{stats2.transaction_count}</span>
            </div>
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {movements2.map(txn => (
              <div key={txn.cash_movement_id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-200">
                    {new Date(txn.transaction_date).toLocaleDateString()}
                  </span>
                  <span className={`font-semibold ${txn.direction.direction_code === 'IN' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {txn.direction.direction_code === 'IN' ? '+' : '-'}{homeCurrency} {Math.abs(txn.home_currency_value).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Delta */}
      <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Period Delta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-blue-200 text-sm mb-1">Inflow Change</div>
            <div className={`text-xl font-bold ${stats2.inflow_home - stats1.inflow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {stats2.inflow_home - stats1.inflow_home >= 0 ? '+' : ''}{homeCurrency} {(stats2.inflow_home - stats1.inflow_home).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-blue-200 text-sm mb-1">Outflow Change</div>
            <div className={`text-xl font-bold ${stats2.outflow_home - stats1.outflow_home >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {stats2.outflow_home - stats1.outflow_home >= 0 ? '+' : ''}{homeCurrency} {(stats2.outflow_home - stats1.outflow_home).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-blue-200 text-sm mb-1">Net Flow Change</div>
            <div className={`text-xl font-bold ${stats2.net_flow_home - stats1.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {stats2.net_flow_home - stats1.net_flow_home >= 0 ? '+' : ''}{homeCurrency} {(stats2.net_flow_home - stats1.net_flow_home).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}