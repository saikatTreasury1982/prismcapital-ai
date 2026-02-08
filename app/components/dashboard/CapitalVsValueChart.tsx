'use client';

import { memo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  displayCurrency: string;
  fxRate: number;
}

const CapitalVsValueChart = memo(function CapitalVsValueChart({ data, displayCurrency, fxRate }: CapitalVsValueChartProps) {

  const formatCurrency = (value: number) => {
    const converted = value * fxRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const [selectedAsset, setSelectedAsset] = useState<ChartData | null>(data[0] || null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2 border-b border-white/20 pb-2">
            {dataPoint.typeName}
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

  const InfoPanel = ({ asset }: { asset: ChartData | null }) => {
    if (!asset) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-blue-300 text-sm text-center">
            Hover over a slice or legend item to view details
          </p>
        </div>
      );
    }

    const pnl = asset.currentValue - asset.capitalInvested;
    const pnlPercent = ((pnl / asset.capitalInvested) * 100).toFixed(1);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-white/20 pb-3 mb-3">
          <h4 className="text-white font-bold text-lg">{asset.typeCode}</h4>
          <p className="text-blue-200 text-sm">{asset.typeName}</p>
          {asset.description && (
            <p className="text-blue-300 text-xs mt-1">{asset.description}</p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-blue-300 text-xs mb-1">Capital Invested</p>
            <p className="text-blue-400 font-semibold text-lg">
              {formatCurrency(asset.capitalInvested)}
            </p>
          </div>
          <div>
            <p className="text-emerald-300 text-xs mb-1">Current Value</p>
            <p className="text-emerald-400 font-semibold text-lg">
              {formatCurrency(asset.currentValue)}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className={`text-xs mb-1 ${pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              Unrealized P/L
            </p>
            <p className={`font-bold text-lg ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(pnl)}
              <span className="text-sm ml-2">
                ({pnl >= 0 ? '+' : ''}{pnlPercent}%)
              </span>
            </p>
          </div>
        </div>

        {/* Holdings List */}
        {asset.tickers && asset.tickers.length > 0 && (
          <div className="flex-1 border-t border-white/20 pt-3">
            <p className="text-blue-200 text-xs font-semibold mb-2">
              Holdings ({asset.tickers.length})
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {asset.tickers.map((ticker, idx) => (
                <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">{ticker.ticker}</span>
                  </div>
                  <p className="text-blue-200 text-[10px] mb-1 truncate">
                    {ticker.tickerName}
                  </p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-blue-300">
                      {formatCurrency(ticker.capitalInvested)}
                    </span>
                    <span className="text-blue-300">→</span>
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
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Capital Invested vs Current Value</h3>
      
      {/* Split Layout: Chart 70% + Info Panel 30% */}
      <div className="flex gap-6">
        {/* Chart Section */}
        <div className="flex-[0.7]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={data}
              margin={{ top: 5, right: 10, left: 20, bottom: 25 }}
              onMouseMove={(state: any) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  setSelectedAsset(data[state.activeTooltipIndex]);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="typeCode"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Bar 
                dataKey="capitalInvested" 
                fill="#3b82f6" 
                name="capitalInvested"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="currentValue" 
                fill="#10b981" 
                name="currentValue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Custom Legend Below Chart */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#3b82f6] rounded"></div>
              <span className="text-white text-sm">Capital Invested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#10b981] rounded"></div>
              <span className="text-white text-sm">Current Value</span>
            </div>
          </div>
        </div>

        {/* Info Panel Section */}
        <div className="flex-[0.3] bg-white/5 rounded-xl p-4 border border-white/10">
          <InfoPanel asset={selectedAsset} />
        </div>
      </div>

      
    </div>
  );
});

export default CapitalVsValueChart;