'use client';

import GlassButton from '@/app/lib/ui/GlassButton';
import { BarChart3, Table2, GitBranch, TrendingUp } from 'lucide-react';

interface InvestmentCardProps {
  summary: {
    totalInvested: number;
    totalMarketValue: number;
    totalUnrealizedPnL: number;
    totalRealizedPnL: number;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshMessage?: string | null;
  onViewChange?: (view: 'standard' | 'strategy' | null) => void;
  activeView?: 'standard' | 'strategy' | null;
  displayCurrency: string;
  fxRate: number;
}

export default function InvestmentCard({
  summary,
  onRefresh,
  isRefreshing = false,
  refreshMessage,
  onViewChange,
  activeView,
  displayCurrency,
  fxRate
}: InvestmentCardProps) {
  const formatCurrency = (value: number) => {
    const converted = value * fxRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            Investment Overview
          </h3>
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

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Capital + Market Value + buttons */}
          <div className="bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl p-4 border border-white/10 flex justify-between gap-3">
            <div>
              <p className="text-blue-200 text-sm mb-1">Capital Invested</p>
              <p className="text-2xl font-bold text-white mb-4">{formatCurrency(summary.totalInvested)}</p>
              <p className="text-blue-200 text-sm mb-1">Market Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalMarketValue)}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0 [&_button]:p-1.5">
              {onRefresh && (
                <GlassButton
                  icon={BarChart3}
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  tooltip={isRefreshing ? "Refreshing..." : "Refresh Market Prices"}
                  variant="primary"
                  size="sm"
                  className={isRefreshing ? 'animate-pulse' : ''}
                />
              )}
              {onViewChange && (
                <>
                  <GlassButton
                    icon={Table2}
                    onClick={() => onViewChange(activeView === 'standard' ? null : 'standard')}
                    tooltip="Display Standard"
                    variant="primary"
                    size="sm"
                    className={activeView === 'standard' ? 'bg-blue-500/40 border-blue-400/80 ring-2 ring-blue-400/50' : 'hover:bg-white/10'}
                  />
                  <GlassButton
                    icon={GitBranch}
                    onClick={() => onViewChange(activeView === 'strategy' ? null : 'strategy')}
                    tooltip="Display By Strategy"
                    variant="primary"
                    size="sm"
                    className={activeView === 'strategy' ? 'bg-blue-500/40 border-blue-400/80 ring-2 ring-blue-400/50' : 'hover:bg-white/10'}
                  />
                </>
              )}
            </div>
          </div>

          {/* Profit / Loss — unchanged */}
          <div className="bg-gradient-to-br from-green-500/5 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-3">Profit / Loss</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-300 text-xs">Unrealized</span>
              <span className={`text-lg font-semibold ${summary.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                {formatCurrency(Math.abs(summary.totalUnrealizedPnL))}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <span className="text-blue-300 text-xs">Realized</span>
              <span className={`text-lg font-semibold ${summary.totalRealizedPnL >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                {formatCurrency(Math.abs(summary.totalRealizedPnL))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Total</span>
              <span className={`text-2xl font-bold ${(summary.totalUnrealizedPnL + summary.totalRealizedPnL) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                {(summary.totalUnrealizedPnL + summary.totalRealizedPnL) >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(summary.totalUnrealizedPnL + summary.totalRealizedPnL))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}