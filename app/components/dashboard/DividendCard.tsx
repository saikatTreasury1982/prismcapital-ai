'use client';

import { Coins } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Calendar, CalendarDays } from 'lucide-react';

interface DividendCardProps {
  summary: {
    totalDividends: number;
    totalStocks: number;
    totalPortfolioCapital: number;
    portfolioYield: number;
    ytdDividends: number;
    ytdStocks: number;
    ytdPayments: number;
    upcomingDividends: number;
    upcomingPayments: number;
  };
  onViewChange?: (view: 'alltime' | 'ytd' | null) => void;
  activeView?: 'alltime' | 'ytd' | null;
  displayCurrency: string;
  fxRate: number;
}

export default function DividendCard({ summary, onViewChange, activeView, displayCurrency, fxRate }: DividendCardProps) {
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
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            Dividend Overview
          </h3>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Total Dividends</p>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(summary.totalDividends)}
            </p>
            
            <div className="border-t border-white/10 my-2" />
            
            <div className="space-y-1">
              <p className="text-blue-300 text-xs">
                Portfolio: {formatCurrency(summary.totalPortfolioCapital)}
              </p>
              <p className="text-emerald-300 text-xs font-semibold">
                Yield: {summary.portfolioYield.toFixed(2)}%
              </p>
            </div>
            
            <p className="text-blue-300 text-xs mt-2">
              {summary.totalStocks} stocks
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/5 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Year-to-Date</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.ytdDividends)}
            </p>
            <p className="text-blue-300 text-xs mt-1">
              {summary.ytdPayments} payments
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-cyan-400">
              {formatCurrency(summary.upcomingDividends)}
            </p>
            <p className="text-cyan-300 text-xs mt-1">
              {summary.upcomingPayments} {summary.upcomingPayments === 1 ? 'payment' : 'payments'}
            </p>
          </div>
        </div>

        {/* Action Buttons - Hidden on mobile */}
        {onViewChange && (
          <div className="hidden md:flex items-center gap-3">
            <GlassButton
              icon={Calendar}
              onClick={() => onViewChange(activeView === 'alltime' ? null : 'alltime')}
              tooltip="All-Time Breakdown"
              variant="primary"
              size="md"
              className={activeView === 'alltime' 
                ? 'bg-amber-500/40 border-amber-400/80 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/50' 
                : 'hover:bg-white/10'}
            />
            
            <GlassButton
              icon={CalendarDays}
              onClick={() => onViewChange(activeView === 'ytd' ? null : 'ytd')}
              tooltip="YTD Breakdown"
              variant="primary"
              size="md"
              className={activeView === 'ytd' 
                ? 'bg-amber-500/40 border-amber-400/80 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/50' 
                : 'hover:bg-white/10'}
            />
          </div>
        )}
      </div>
    </div>
  );
}