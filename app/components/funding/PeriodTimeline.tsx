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
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 rounded-2xl p-6 border border-white/10 mb-8 overflow-x-auto">
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

          {/* Data points with interactive tooltips */}
          {periods.map((period, idx) => {
            const x = (idx / (periods.length - 1)) * chartWidth;
            const y = chartHeight - ((period.cumulative_home - minValue) / valueRange) * chartHeight;
            const isPositive = period.cumulative_home >= 0;
            const netFlow = period.net_flow_home;
            
            return (
              <g key={idx} className="group">
                {/* Tooltip background */}
                <rect
                  x={x - 90}
                  y={y - 110}
                  width="180"
                  height="115"
                  fill="rgba(15, 23, 42, 0.98)"
                  stroke="rgba(147, 197, 253, 0.5)"
                  strokeWidth="2"
                  rx="12"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))"
                />
                
                {/* Tooltip content */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {/* Date */}
                  <text x={x} y={y - 85} fill="rgb(147, 197, 253)" fontSize="13" textAnchor="middle" fontWeight="600">
                    {new Date(period.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </text>
                  
                  {/* Inflow */}
                  <text x={x - 75} y={y - 65} fill="rgb(134, 239, 172)" fontSize="11" textAnchor="start" fontWeight="500">
                    Inflow:
                  </text>
                  <text x={x + 75} y={y - 65} fill="rgb(134, 239, 172)" fontSize="11" textAnchor="end" fontWeight="600">
                    {homeCurrency} {period.inflow_home.toFixed(2)}
                  </text>
                  
                  {/* Outflow */}
                  <text x={x - 75} y={y - 48} fill="rgb(251, 113, 133)" fontSize="11" textAnchor="start" fontWeight="500">
                    Outflow:
                  </text>
                  <text x={x + 75} y={y - 48} fill="rgb(251, 113, 133)" fontSize="11" textAnchor="end" fontWeight="600">
                    {homeCurrency} {period.outflow_home.toFixed(2)}
                  </text>
                  
                  {/* Divider line */}
                  <line x1={x - 75} y1={y - 40} x2={x + 75} y2={y - 40} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                  
                  {/* Net Flow */}
                  <text x={x - 75} y={y - 25} fill="white" fontSize="11" textAnchor="start" fontWeight="500">
                    Net:
                  </text>
                  <text x={x + 75} y={y - 25} fill={netFlow >= 0 ? "rgb(134, 239, 172)" : "rgb(251, 113, 133)"} fontSize="12" textAnchor="end" fontWeight="700">
                    {netFlow >= 0 ? '+' : ''}{homeCurrency} {netFlow.toFixed(2)}
                  </text>
                  
                  {/* Cumulative */}
                  <text x={x} y={y - 8} fill="rgb(96, 165, 250)" fontSize="10" textAnchor="middle" fontWeight="500">
                    Cumulative: {homeCurrency} {period.cumulative_home.toFixed(2)}
                  </text>
                </g>

                {/* Point circle - must be last to be on top */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={isPositive ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all group-hover:r-9"
                />
                
                {/* Hover area - invisible larger circle for easier hovering */}
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                />
                
                {/* Period label */}
                <text
                  x={x}
                  y={chartHeight + 20}
                  fill="rgba(147, 197, 253, 0.9)"
                  fontSize="11"
                  textAnchor="middle"
                  className="select-none"
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