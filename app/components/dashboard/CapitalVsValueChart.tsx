'use client';

import { memo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ChartData {
  typeCode: string;
  typeName: string;
  description: string;
  capitalInvested: number;
  currentValue: number;
  tickers: {
    ticker: string;
    tickerName: string;
    capitalInvested: number;
    currentValue: number;
  }[];
}

interface CapitalVsValueChartProps {
  data: ChartData[];
}

const CapitalVsValueChart = memo(function CapitalVsValueChart({ data }: CapitalVsValueChartProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2 border-b border-white/20 pb-2">
            {dataPoint.typeCode} - {dataPoint.typeName}
          </p>
          {dataPoint.description && (
            <p className="text-blue-300 text-xs mb-2">{dataPoint.description}</p>
          )}
          
          <div className="mb-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-300">Capital Invested:</span>
              <span className="text-blue-400 font-semibold">
                {formatCurrency(dataPoint.capitalInvested)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-300">Current Value:</span>
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(dataPoint.currentValue)}
              </span>
            </div>
          </div>

          {dataPoint.tickers && dataPoint.tickers.length > 0 && (
            <div className="border-t border-white/20 pt-2 mt-2">
              <p className="text-blue-200 text-xs font-semibold mb-1">Tickers:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {dataPoint.tickers.map((ticker: any, idx: number) => (
                  <div key={idx} className="text-xs bg-white/5 rounded p-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-white font-medium">{ticker.ticker}</span>
                      <span className="text-blue-200 text-[10px] truncate">
                        {ticker.tickerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">
                        {formatCurrency(ticker.capitalInvested)}
                      </span>
                      <span className="text-emerald-300">
                        {formatCurrency(ticker.currentValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Capital Invested vs Current Value</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-300 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {isExpanded && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="typeCode"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: 'white' }}
                formatter={(value: string) => (
                  <span className="text-white text-sm">
                    {value === 'capitalInvested' ? 'Capital Invested' : 'Current Value'}
                  </span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="capitalInvested" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                name="capitalInvested"
              />
              <Line 
                type="monotone" 
                dataKey="currentValue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                name="currentValue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default CapitalVsValueChart;