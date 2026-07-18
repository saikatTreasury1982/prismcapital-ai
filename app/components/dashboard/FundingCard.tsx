'use client';

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
    <div className="backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 overflow-hidden">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-blue-200 text-sm mb-1">Total Deposited</p>
          <p className="text-2xl font-bold text-emerald-400 mb-3">{formatCurrency(summary.totalDeposited, summary.currency)}</p>
          <p className="text-blue-200 text-sm mb-1">Total Withdrawn</p>
          <p className="text-2xl font-bold text-orange-400 mb-3">{formatCurrency(summary.totalWithdrawn, summary.currency)}</p>
          <div className="border-t border-white/10 pt-3">
            <p className="text-blue-200 text-sm mb-1">Net Cash Balance</p>
            <p className={`text-2xl font-bold ${summary.netCashBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(summary.netCashBalance, summary.currency)}
            </p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-300">Deposits</span>
            <span className="text-white font-medium">{details?.depositCount ?? '-'}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-white/10">
            <span className="text-blue-300">Withdrawals</span>
            <span className="text-white font-medium">{details?.withdrawalCount ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">First transaction</span>
            <span className="text-white font-medium">{details ? formatDate(details.firstTransactionDate) : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-300">Last transaction</span>
            <span className="text-white font-medium">{details ? formatDate(details.lastTransactionDate) : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}