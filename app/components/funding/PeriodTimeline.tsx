'use client';

import { BarChart3 } from 'lucide-react';
import { PeriodStats } from '../../lib/types/funding';

interface PeriodTimelineProps {
  periods: PeriodStats[];
  homeCurrency: string;
  tradingCurrency: string;
}

export function PeriodTimeline({ periods, homeCurrency, tradingCurrency }: PeriodTimelineProps) {
  if (periods.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-6 h-6" />
          Capital Flow Timeline
        </h2>
        <div className="text-center py-12 text-blue-200">
          No transactions yet. Start by recording your first cash movement!
        </div>
      </div>
    );
  }

  const maxCapital = Math.max(...periods.map(p => Math.abs(p.cumulative_home)));

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <BarChart3 className="w-6 h-6" />
        Capital Flow Timeline
      </h2>
      
      {/* Timeline visualization */}
      <div className="relative mb-8">
        {/* Baseline */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10"></div>
        
        {/* Flow points */}
        <div className="flex justify-between items-center py-12 relative">
          {periods.map((data, idx) => {
            const heightPercent = (Math.abs(data.cumulative_home) / maxCapital) * 100;
            const isPositive = data.cumulative_home >= 0;
            
            return (
              <div key={idx} className="flex flex-col items-center relative group cursor-pointer" style={{ flex: 1 }}>
                {/* Vertical bar */}
                <div 
                  className={`w-2 rounded-full transition-all duration-500 ${
                    isPositive 
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' 
                      : 'bg-gradient-to-b from-rose-500 to-rose-300'
                  }`}
                  style={{ 
                    height: `${Math.max(heightPercent, 20)}px`,
                    marginBottom: isPositive ? '0' : 'auto',
                    marginTop: isPositive ? 'auto' : '0'
                  }}
                ></div>
                
                {/* Capital amount on hover */}
                <div className={`absolute ${isPositive ? 'bottom-full mb-2' : 'top-full mt-2'} whitespace-nowrap`}>
                  <div className={`text-xs font-bold ${isPositive ? 'text-emerald-300' : 'text-rose-300'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {homeCurrency} {data.cumulative_home.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                
                {/* Period label */}
                <div className="absolute top-1/2 mt-8 text-xs text-blue-200 transform -rotate-45 origin-left whitespace-nowrap">
                  {new Date(data.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                
                {/* Hover card */}
                <div className="absolute top-full mt-16 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                  <div className="backdrop-blur-xl bg-slate-900/90 rounded-xl p-4 border border-white/20 shadow-2xl min-w-[220px]">
                    <div className="text-white font-semibold mb-2">
                      {new Date(data.period).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-300">Inflow:</span>
                        <span className="text-white font-semibold">{homeCurrency} {data.inflow_home.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-300">Outflow:</span>
                        <span className="text-white font-semibold">{homeCurrency} {data.outflow_home.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-white/10">
                        <span className="text-blue-200">Net:</span>
                        <span className={`font-bold ${data.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {homeCurrency} {data.net_flow_home.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Transactions:</span>
                        <span className="text-white">{data.transaction_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl p-4 border border-emerald-400/30">
          <div className="text-emerald-300 text-sm mb-1">Total Inflows</div>
          <div className="text-2xl font-bold text-white">
            {homeCurrency} {periods.reduce((sum, d) => sum + d.inflow_home, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 rounded-2xl p-4 border border-rose-400/30">
          <div className="text-rose-300 text-sm mb-1">Total Outflows</div>
          <div className="text-2xl font-bold text-white">
            {homeCurrency} {periods.reduce((sum, d) => sum + d.outflow_home, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/10 rounded-2xl p-4 border border-blue-400/30">
          <div className="text-blue-300 text-sm mb-1">Current Capital</div>
          <div className="text-2xl font-bold text-white">
            {homeCurrency} {(periods[periods.length - 1]?.cumulative_home || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
      </div>
    </div>
  );
}