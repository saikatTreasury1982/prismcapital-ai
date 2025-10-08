'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PeriodStats } from '../../lib/types/funding';

interface PeriodTimelineProps {
  periods: PeriodStats[];
  homeCurrency: string;
  tradingCurrency: string;
}

export function PeriodTimeline({ periods, homeCurrency, tradingCurrency }: PeriodTimelineProps) {
  // State to track selected period (default to last period)
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(periods.length - 1);

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

  const selectedPeriod = periods[selectedPeriodIndex] || periods[periods.length - 1];

  // Calculate chart dimensions and scales
  const maxCapital = Math.max(...periods.map(p => Math.abs(p.cumulative_home)));
  const minCapital = Math.min(...periods.map(p => p.cumulative_home), 0);
  const range = maxCapital - minCapital;
  const padding = range * 0.1; // 10% padding
  
  const chartHeight = 300;
  const chartWidth = 1000;
  const maxValue = maxCapital + padding;
  const minValue = minCapital - padding;
  const valueRange = maxValue - minValue;

  // Generate SVG path for line
  const generatePath = () => {
    if (periods.length === 0) return '';
    
    const points = periods.map((period, idx) => {
      const x = (idx / (periods.length - 1)) * chartWidth;
      const y = chartHeight - ((period.cumulative_home - minValue) / valueRange) * chartHeight;
      return { x, y, value: period.cumulative_home };
    });

    // Create smooth curve using quadratic bezier curves
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      
      path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
      path += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  // Generate area fill path
  const generateAreaPath = () => {
    const linePath = generatePath();
    const lastX = ((periods.length - 1) / (periods.length - 1)) * chartWidth;
    const zeroY = chartHeight - ((0 - minValue) / valueRange) * chartHeight;
    
    return `${linePath} L ${lastX} ${zeroY} L 0 ${zeroY} Z`;
  };

  const linePath = generatePath();
  const areaPath = generateAreaPath();
  const zeroLine = chartHeight - ((0 - minValue) / valueRange) * chartHeight;

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <BarChart3 className="w-6 h-6" />
        Capital Flow Timeline
      </h2>
      
      {/* Chart Container */}
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 rounded-2xl p-6 border border-white/10 mb-8 overflow-x-auto relative">
        {/* Fixed Info Box - Top Left */}
        <div className="absolute top-6 left-6 z-10 backdrop-blur-xl bg-slate-900/95 rounded-xl p-4 border-2 border-blue-400/50 shadow-2xl min-w-[200px]">
          {/* Date */}
          <div className="text-blue-300 text-sm font-semibold mb-3 border-b border-white/20 pb-2">
            {new Date(selectedPeriod.period).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          
          {/* Inflow */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-emerald-300 text-xs font-medium">Inflow:</span>
            <span className="text-emerald-300 text-sm font-bold">
              {homeCurrency} {selectedPeriod.inflow_home.toFixed(2)}
            </span>
          </div>
          
          {/* Outflow */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-rose-300 text-xs font-medium">Outflow:</span>
            <span className="text-rose-300 text-sm font-bold">
              {homeCurrency} {selectedPeriod.outflow_home.toFixed(2)}
            </span>
          </div>
          
          {/* Divider */}
          <div className="border-t border-white/20 my-2"></div>
          
          {/* Net Flow */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-xs font-medium">Net:</span>
            <span className={`text-sm font-bold ${
              selectedPeriod.net_flow_home >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {selectedPeriod.net_flow_home >= 0 ? '+' : ''}
              {homeCurrency} {selectedPeriod.net_flow_home.toFixed(2)}
            </span>
          </div>
          
          {/* Cumulative */}
          <div className="flex justify-between items-center">
            <span className="text-blue-300 text-xs font-medium">Cumulative:</span>
            <span className="text-blue-300 text-sm font-bold">
              {homeCurrency} {selectedPeriod.cumulative_home.toFixed(2)}
            </span>
          </div>
        </div>

        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-auto min-h-[300px]"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="negativeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight * ratio;
            const value = maxValue - (valueRange * ratio);
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x="-10"
                  y={y + 4}
                  fill="rgba(147, 197, 253, 0.7)"
                  fontSize="12"
                  textAnchor="end"
                >
                  {homeCurrency} {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Zero line (if applicable) */}
          {minValue < 0 && maxValue > 0 && (
            <line
              x1="0"
              y1={zeroLine}
              x2={chartWidth}
              y2={zeroLine}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          )}

          {/* Area fill */}
          <path
            d={areaPath}
            fill={periods[periods.length - 1]?.cumulative_home >= 0 ? "url(#areaGradient)" : "url(#negativeAreaGradient)"}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={periods[periods.length - 1]?.cumulative_home >= 0 ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points - clickable */}
          {periods.map((period, idx) => {
            const x = (idx / (periods.length - 1)) * chartWidth;
            const y = chartHeight - ((period.cumulative_home - minValue) / valueRange) * chartHeight;
            const isPositive = period.cumulative_home >= 0;
            const isSelected = idx === selectedPeriodIndex;
            
            return (
              <g key={idx} onClick={() => setSelectedPeriodIndex(idx)} className="cursor-pointer">
                {/* Orange ring for selected dot */}
                {isSelected && (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="rgb(249, 115, 22)"
                      strokeWidth="3"
                      className="animate-pulse"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="none"
                      stroke="rgba(249, 115, 22, 0.5)"
                      strokeWidth="2"
                    />
                  </>
                )}
                
                {/* Point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={isPositive ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all hover:r-8"
                />
                
                {/* Larger invisible click area */}
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="transparent"
                />
                
                {/* Period label */}
                <text
                  x={x}
                  y={chartHeight + 20}
                  fill="rgba(147, 197, 253, 0.9)"
                  fontSize="11"
                  textAnchor="middle"
                  className="select-none pointer-events-none"
                >
                  {new Date(period.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>
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