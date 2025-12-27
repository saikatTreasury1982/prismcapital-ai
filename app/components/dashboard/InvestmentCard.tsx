'use client';

import { useState } from 'react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Info, BarChart3 } from 'lucide-react';

interface Position {
  ticker: string;
  tickerName: string;
  quantity: number;
  averageCost: number;
  capitalInvested: number;
  daysHeld: number;
  currentValue: number;
  moneyness: number;
  currency: string;
}

interface InvestmentCardProps {
  summary: {
    totalInvested: number;
    totalMarketValue: number;
    totalUnrealizedPnL: number;
  };
  positions: Position[];
  onRefresh?: () => void;  
  isRefreshing?: boolean;  
  refreshMessage?: string | null; 
}

export default function InvestmentCard({ 
  summary, 
  positions,
  onRefresh,
  isRefreshing = false,
  refreshMessage 
}: InvestmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden max-w-6xl">
      {/* Summary Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Investment Overview
            </h3>
            {onRefresh && (
              <GlassButton
                icon={BarChart3}
                onClick={onRefresh}
                disabled={isRefreshing}
                tooltip={isRefreshing ? "Refreshing..." : "Refresh Market Prices"}
                variant="primary"
                size="md"
                className={isRefreshing ? 'animate-pulse' : ''}
              />
            )}
          </div>
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

        {/* Loading/Status Message */}
        {isRefreshing && (
          <div className="mb-4 bg-blue-500/20 border border-blue-400/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-200 text-sm font-medium">Refreshing market prices...</p>
          </div>
        )}

        {!isRefreshing && refreshMessage && (
          <div className="mb-4 bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-4 py-3">
            <p className="text-emerald-200 text-sm font-medium">✓ {refreshMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Capital Invested</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalInvested)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Market Value</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalMarketValue)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Unrealized P/L</p>
            <p
              className={`text-2xl font-bold ${
                summary.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(summary.totalUnrealizedPnL)}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-white/10">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Position Details</h4>
            
            <div>
            <table className="w-full table-fixed">
                <thead>
                <tr className="border-b border-white/10">
                    <th className="text-left text-blue-200 text-sm font-medium pb-3 w-[10%]">Ticker</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[10%]">Quantity</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[12%]">Avg Cost</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[14%]">Capital</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[12%]">Days Held</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[16%]">Market Value</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[16%]">Moneyness</th>
                </tr>
                </thead>
                <tbody>
                {positions.map((position, index) => (
                    <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2">
                          <div className="flex items-center gap-1 group relative">
                          <DollarSign className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-white font-medium text-sm truncate">{position.ticker}</span>
                          <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          
                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {position.tickerName}
                          </div>
                          </div>
                      </td>
                      <td className="text-right text-white text-sm py-2">{formatNumber(position.quantity)}</td>
                      <td className="text-right text-white text-sm py-2">
                          {formatCurrency(position.averageCost, position.currency)}
                      </td>
                      <td className="text-right text-white text-sm py-2">
                          {formatCurrency(position.capitalInvested, position.currency)}
                      </td>
                      <td className="text-right text-blue-200 text-sm py-2">{position.daysHeld} days</td>
                      <td className="text-right text-white text-sm py-2">
                          {formatCurrency(position.currentValue, position.currency)}
                      </td>
                      <td className="text-right py-2">
                        <div className={`font-medium text-sm flex items-center justify-end gap-1 ${
                          position.moneyness >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.moneyness >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatCurrency(position.moneyness, position.currency)}
                        </div>
                        <div className={`text-xs font-medium ${
                          position.moneyness >= 0 ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {(() => {
                            const percentage = position.capitalInvested > 0 
                              ? (position.moneyness / position.capitalInvested) * 100 
                              : 0;
                            return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
                          })()}
                        </div>
                      </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}