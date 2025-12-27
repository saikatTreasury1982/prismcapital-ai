'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Coins, DollarSign, Info } from 'lucide-react';

interface TickerBreakdown {
  ticker: string;
  tickerName: string;
  totalPayments: number;
  totalReceived: number;
  avgPerShare: number;
  latestExDivDate: string | null;
  latestPaymentDate: string | null;
}

interface DividendCardProps {
  summary: {
    totalDividends: number;
    totalStocks: number;
    ytdDividends: number;
    ytdStocks: number;
    ytdPayments: number;
    upcomingDividends: number;
    upcomingPayments: number;
  };
  allTimeBreakdown: TickerBreakdown[];
  ytdBreakdown: TickerBreakdown[];
}

export default function DividendCard({ summary, allTimeBreakdown, ytdBreakdown }: DividendCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTotalExpanded, setIsTotalExpanded] = useState(false);
  const [isYtdExpanded, setIsYtdExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const BreakdownTable = ({ data }: { data: TickerBreakdown[] }) => (
    <div className="mt-4">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-blue-200 text-sm font-medium pb-3 w-[15%]">Ticker</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[12%]">Payments</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Total Received</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[15%]">Avg/Share</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[19%]">Ex-Div Date</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[19%]">Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-2">
                <div className="flex items-center gap-1 group relative">
                  <DollarSign className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-white font-medium text-sm">{item.ticker}</span>
                  {item.tickerName !== item.ticker && (
                    <>
                      <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {item.tickerName}
                      </div>
                    </>
                  )}
                </div>
              </td>
              <td className="text-right text-white text-sm py-2">{item.totalPayments}</td>
              <td className="text-right text-amber-400 font-medium text-sm py-2">
                {formatCurrency(item.totalReceived)}
              </td>
              <td className="text-right text-white text-sm py-2">
                {formatCurrency(item.avgPerShare)}
              </td>
              <td className="text-right text-blue-200 text-sm py-2">
                {formatDate(item.latestExDivDate)}
              </td>
              <td className="text-right text-emerald-200 text-sm py-2">
                {formatDate(item.latestPaymentDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Dividend Overview
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

        {/* Summary Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Dividends Card */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Total Dividends</p>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(summary.totalDividends)}
            </p>
            <p className="text-blue-300 text-xs mt-1">
              {summary.totalStocks} stocks
            </p>
          </div>

          {/* Year-to-Date Card */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Year-to-Date</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.ytdDividends)}
            </p>
            <p className="text-blue-300 text-xs mt-1">
              {summary.ytdPayments} payments
            </p>
          </div>

          {/* Upcoming Dividends Card */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-cyan-400">
              {formatCurrency(summary.upcomingDividends)}
            </p>
            <p className="text-cyan-300 text-xs mt-1">
              {summary.upcomingPayments} {summary.upcomingPayments === 1 ? 'payment' : 'payments'}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Breakdown Section */}
      {isExpanded && (
        <div className="border-t border-white/10 p-6">
          <div className="space-y-4">
            {/* Total Dividends Breakdown */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setIsTotalExpanded(!isTotalExpanded)}
                className="w-full p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white font-semibold">All-Time Breakdown</p>
                    <p className="text-blue-200 text-xs mt-1">
                      {allTimeBreakdown.length} stocks
                    </p>
                  </div>
                  {isTotalExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              {isTotalExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <BreakdownTable data={allTimeBreakdown} />
                </div>
              )}
            </div>

            {/* Year-to-Date Breakdown */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setIsYtdExpanded(!isYtdExpanded)}
                className="w-full p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white font-semibold">YTD Breakdown</p>
                    <p className="text-blue-200 text-xs mt-1">
                      {ytdBreakdown.length} stocks
                    </p>
                  </div>
                  {isYtdExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              {isYtdExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <BreakdownTable data={ytdBreakdown} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}