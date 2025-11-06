'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface FundingCardProps {
  summary: {
    totalDeposited: number;
    totalWithdrawn: number;
    netCashBalance: number;
    currency: string;
  };
  details: {
    tradingCurrency: {
      totalDeposited: number;
      totalWithdrawn: number;
      netBalance: number;
    };
    weightedAvgRate: number;
    depositCount: number;
    withdrawalCount: number;
    firstTransactionDate: string;
    lastTransactionDate: string;
  } | null;
}

export default function FundingCard({ summary, details }: FundingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      {/* Summary Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Funding Overview
          </h3>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Total Deposited</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(summary.totalDeposited, summary.currency)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Total Withdrawn</p>
            <p className="text-2xl font-bold text-orange-400">
              {formatCurrency(summary.totalWithdrawn, summary.currency)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Net Cash Balance</p>
            <p
              className={`text-2xl font-bold ${
                summary.netCashBalance >= 0 ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatCurrency(summary.netCashBalance, summary.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && details && (
        <div className="border-t border-white/10">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Funding Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-blue-200 text-sm">Deposits</span>
                  </div>
                  <span className="text-white font-medium">{details.depositCount}</span>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-blue-200 text-sm">Withdrawals</span>
                  </div>
                  <span className="text-white font-medium">{details.withdrawalCount}</span>
                </div>

                {details.weightedAvgRate > 0 && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                    <span className="text-blue-200 text-sm">Avg Exchange Rate</span>
                    <span className="text-white font-medium">
                      {details.weightedAvgRate.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-blue-200 text-sm mb-1">First Transaction</p>
                  <p className="text-white font-medium">
                    {formatDate(details.firstTransactionDate)}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-blue-200 text-sm mb-1">Last Transaction</p>
                  <p className="text-white font-medium">
                    {formatDate(details.lastTransactionDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Trading Currency Info */}
            {details.tradingCurrency.netBalance !== 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h5 className="text-white font-semibold mb-3">Trading Currency</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Deposited</p>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(details.tradingCurrency.totalDeposited, 'USD')}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Withdrawn</p>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(details.tradingCurrency.totalWithdrawn, 'USD')}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-blue-200 text-xs mb-1">Net Balance</p>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(details.tradingCurrency.netBalance, 'USD')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}