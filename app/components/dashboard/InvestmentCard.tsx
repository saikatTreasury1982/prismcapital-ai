'use client';

import GlassButton from '@/app/lib/ui/GlassButton';
import { BarChart3, Table2, GitBranch, TrendingUp } from 'lucide-react';

interface InvestmentCardProps {
  summary: {
    totalInvested: number;
    totalMarketValue: number;
    totalUnrealizedPnL: number;
  };
  onRefresh?: () => void;  
  isRefreshing?: boolean;  
  refreshMessage?: string | null;
  onViewChange?: (view: 'standard' | 'strategy' | null) => void;
  activeView?: 'standard' | 'strategy' | null;
}

export default function InvestmentCard({ 
  summary, 
  onRefresh,
  isRefreshing = false,
  refreshMessage,
  onViewChange,
  activeView
}: InvestmentCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Capital Invested</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalInvested)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Market Value</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.totalMarketValue)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-4 border border-white/10">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
          
          {onViewChange && (
            <>
              <GlassButton
                icon={Table2}
                onClick={() => onViewChange(activeView === 'standard' ? null : 'standard')}
                tooltip="Display Standard"
                variant="primary"
                size="md"
                className={activeView === 'standard' 
                  ? 'bg-blue-500/40 border-blue-400/80 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/50' 
                  : 'hover:bg-white/10'}
              />
              
              <GlassButton
                icon={GitBranch}
                onClick={() => onViewChange(activeView === 'strategy' ? null : 'strategy')}
                tooltip="Display By Strategy"
                variant="primary"
                size="md"
                className={activeView === 'strategy' 
                  ? 'bg-blue-500/40 border-blue-400/80 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/50' 
                  : 'hover:bg-white/10'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}