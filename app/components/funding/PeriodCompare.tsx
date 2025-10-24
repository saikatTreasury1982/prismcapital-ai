'use client';

import { useState, useEffect } from 'react';
import { getUniquePeriods, getMovementsForPeriod } from '../../services/cashMovementServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';
import { ArrowLeftRight } from 'lucide-react';
import { PeriodStats, CashMovementWithDirection } from '../../lib/types/funding';

interface PeriodCompareProps {
  periods: PeriodStats[];
  allMovements: CashMovementWithDirection[];
  home_currency: string;  // Keep snake_case to match database
}

export function PeriodCompare({ home_currency }: PeriodCompareProps) {
  const [periods, setPeriods] = useState<Array<{period_from: string, period_to: string | null, period_display: string}>>([]);
  const [movements1, setMovements1] = useState<CashMovementWithDirection[]>([]);
  const [movements2, setMovements2] = useState<CashMovementWithDirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod1, setSelectedPeriod1] = useState('');
  const [selectedPeriod2, setSelectedPeriod2] = useState('');

    // Fetch unique periods on mount
    useEffect(() => {
      const fetchPeriods = async () => {
        setLoading(true);
        try {
          const uniquePeriods = await getUniquePeriods(CURRENT_USER_ID);
          setPeriods(uniquePeriods);
          
          if (uniquePeriods.length > 0) {
            const firstPeriod = `${uniquePeriods[0].period_from}|${uniquePeriods[0].period_to}`;
            const lastPeriod = `${uniquePeriods[uniquePeriods.length - 1].period_from}|${uniquePeriods[uniquePeriods.length - 1].period_to}`;
            
            setSelectedPeriod1(firstPeriod);
            setSelectedPeriod2(lastPeriod);
          }
        } catch (error) {
          console.error('Error fetching periods:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPeriods();
    }, []);

    // Fetch movements when period 1 changes
    useEffect(() => {
      if (!selectedPeriod1) return;
      
      const [periodFrom, periodTo] = selectedPeriod1.split('|');
      const fetchMovements = async () => {
        try {
          const data = await getMovementsForPeriod(CURRENT_USER_ID, periodFrom, periodTo === 'null' ? null : periodTo);
          setMovements1(data);
        } catch (error) {
          console.error('Error fetching movements for period 1:', error);
        }
      };

      fetchMovements();
    }, [selectedPeriod1]);

    // Fetch movements when period 2 changes
    useEffect(() => {
      if (!selectedPeriod2) return;
      
      const [periodFrom, periodTo] = selectedPeriod2.split('|');
      const fetchMovements = async () => {
        try {
          const data = await getMovementsForPeriod(CURRENT_USER_ID, periodFrom, periodTo === 'null' ? null : periodTo);
          setMovements2(data);
        } catch (error) {
          console.error('Error fetching movements for period 2:', error);
        }
      };

      fetchMovements();
    }, [selectedPeriod2]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6" />
          Period Comparison
        </h2>
        <div className="text-center py-12 text-blue-200">
          Loading periods...
        </div>
      </div>
    );
  }

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

  // Calculate stats from movements
  const calculateStats = (movements: CashMovementWithDirection[]) => {
    return movements.reduce((acc, m) => {
      const multiplier = m.direction.multiplier;
      if (multiplier > 0) {
        acc.inflow_home += m.home_currency_value;
      } else {
        acc.outflow_home += m.home_currency_value;
      }
      acc.net_flow_home += m.home_currency_value * multiplier;
      acc.transaction_count++;
      return acc;
    }, { inflow_home: 0, outflow_home: 0, net_flow_home: 0, transaction_count: 0 });
  };

  const stats1 = calculateStats(movements1);
  const stats2 = calculateStats(movements2);

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
          {periods.map((p, idx) => (
            <option key={idx} value={`${p.period_from}|${p.period_to}`} className="bg-slate-800 text-white">
              {p.period_display}
            </option>
          ))}
          </select>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 border border-blue-400/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Inflow</span>
              <span className="text-emerald-300 text-xl font-bold">
                {home_currency} {stats1.inflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Outflow</span>
              <span className="text-rose-300 text-xl font-bold">
                {home_currency} {stats1.outflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/20">
              <span className="text-white font-semibold">Net Flow</span>
              <span className={`text-2xl font-bold ${stats1.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {home_currency} {stats1.net_flow_home.toFixed(2)}
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
                    {txn.direction.direction_code === 'IN' ? '+' : '-'}{home_currency} {Math.abs(txn.home_currency_value).toFixed(2)}
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
          {periods.map((p, idx) => (
            <option key={idx} value={`${p.period_from}|${p.period_to}`} className="bg-slate-800 text-white">
              {p.period_display}
            </option>
          ))}
          </select>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-6 border border-purple-400/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Inflow</span>
              <span className="text-emerald-300 text-xl font-bold">
                {home_currency} {stats2.inflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Outflow</span>
              <span className="text-rose-300 text-xl font-bold">
                {home_currency} {stats2.outflow_home.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/20">
              <span className="text-white font-semibold">Net Flow</span>
              <span className={`text-2xl font-bold ${stats2.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {home_currency} {stats2.net_flow_home.toFixed(2)}
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
                    {txn.direction.direction_code === 'IN' ? '+' : '-'}{home_currency} {Math.abs(txn.home_currency_value).toFixed(2)}
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
              {stats2.inflow_home - stats1.inflow_home >= 0 ? '+' : ''}{home_currency} {(stats2.inflow_home - stats1.inflow_home).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-blue-200 text-sm mb-1">Outflow Change</div>
            <div className={`text-xl font-bold ${stats2.outflow_home - stats1.outflow_home >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {stats2.outflow_home - stats1.outflow_home >= 0 ? '+' : ''}{home_currency} {(stats2.outflow_home - stats1.outflow_home).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-blue-200 text-sm mb-1">Net Flow Change</div>
            <div className={`text-xl font-bold ${stats2.net_flow_home - stats1.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {stats2.net_flow_home - stats1.net_flow_home >= 0 ? '+' : ''}{home_currency} {(stats2.net_flow_home - stats1.net_flow_home).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}