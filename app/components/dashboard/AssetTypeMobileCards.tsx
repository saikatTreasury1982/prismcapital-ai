'use client';

import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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

interface AssetTypeMobileCardsProps {
  data: ChartData[];
}

export function AssetTypeMobileCards({ data }: AssetTypeMobileCardsProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalInvestment = data.reduce((sum, item) => sum + item.capitalInvested, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Portfolio by Asset Type</h3>
      
      {data.map((assetType) => {
        const unrealizedPnL = assetType.currentValue - assetType.capitalInvested;
        const percentage = ((assetType.capitalInvested / totalInvestment) * 100).toFixed(1);
        const isExpanded = expandedType === assetType.typeCode;
        const showableTickers = isExpanded ? assetType.tickers : assetType.tickers.slice(0, 3);
        const hasMore = assetType.tickers.length > 3;

        return (
          <div
            key={assetType.typeCode}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/20">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-white font-bold text-lg">{assetType.typeCode}</h4>
                  <p className="text-blue-200 text-sm">{assetType.typeName}</p>
                  {assetType.description && (
                    <p className="text-blue-300 text-xs mt-1">{assetType.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-blue-300 text-sm font-semibold">{percentage}%</p>
                  <p className="text-blue-200 text-xs">of portfolio</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Capital Invested</span>
                <span className="text-white font-semibold">
                  {formatCurrency(assetType.capitalInvested)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">Current Value</span>
                <span className="text-white font-semibold">
                  {formatCurrency(assetType.currentValue)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-blue-300 text-sm font-medium">Unrealized P/L</span>
                <span className={`font-bold flex items-center gap-1 ${
                  unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {unrealizedPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatCurrency(Math.abs(unrealizedPnL))}
                  <span className="text-xs">
                    ({unrealizedPnL >= 0 ? '+' : '-'}
                    {Math.abs((unrealizedPnL / assetType.capitalInvested) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Holdings */}
            {assetType.tickers.length > 0 && (
              <div className="border-t border-white/20">
                <div className="p-4">
                  <p className="text-blue-200 text-xs font-semibold mb-2">
                    Holdings ({assetType.tickers.length})
                  </p>
                  <div className="space-y-2">
                    {showableTickers.map((ticker, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-lg p-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{ticker.ticker}</span>
                            <span className="text-blue-200 text-[10px] truncate max-w-[120px]">
                              {ticker.tickerName}
                            </span>
                          </div>
                        </div>
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

                  {/* Expand/Collapse Button */}
                  {hasMore && (
                    <button
                      onClick={() => setExpandedType(isExpanded ? null : assetType.typeCode)}
                      className="w-full mt-3 py-2 text-blue-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show {assetType.tickers.length - 3} More
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}