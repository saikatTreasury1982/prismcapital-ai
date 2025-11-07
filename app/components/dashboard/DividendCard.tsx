'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Info, Calendar } from 'lucide-react';

interface TickerBreakdown {
  ticker: string;
  tickerName: string;
  totalPayments: number;
  totalReceived: number;
  avgPerShare: number;
  latestDate: string;
}

interface QuarterlyBreakdown {
  year: number;
  quarter: number;
  stocksPaid: number;
  totalPayments: number;
  totalReceived: number;
  startDate: string;
  endDate: string;
}

interface DividendCardProps {
  summary: {
    totalDividends: number;
    ytdDividends: number;
    dividendPayingStocks: number;
    ytdPayments: number;
  };
  breakdown: TickerBreakdown[];
  quarterly: QuarterlyBreakdown[];
}

export default function DividendCard({ summary, breakdown, quarterly }: DividendCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const getQuarterLabel = (quarter: number) => {
    return `Q${quarter}`;
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      {/* Summary Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Total Dividends</p>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(summary.totalDividends)}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Year-to-Date</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(summary.ytdDividends)}
            </p>
            <p className="text-blue-200 text-xs mt-1">
              {summary.ytdPayments} payments
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-sm mb-1">Paying Stocks</p>
            <p className="text-2xl font-bold text-white">
              {summary.dividendPayingStocks}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-white/10">
          <div className="p-6">
            {/* Quarterly Breakdown */}
            {quarterly.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  Quarterly Breakdown (Current Year)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {quarterly.map((q, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-amber-400 font-semibold mb-2">
                        {getQuarterLabel(q.quarter)} {q.year}
                      </p>
                      <p className="text-white text-lg font-bold mb-1">
                        {formatCurrency(q.totalReceived)}
                      </p>
                      <p className="text-blue-200 text-xs">
                        {q.totalPayments} payments • {q.stocksPaid} stocks
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ticker Breakdown */}
            <h4 className="text-lg font-semibold text-white mb-4">Breakdown by Ticker</h4>
            
            <div>
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-blue-200 text-sm font-medium pb-3 w-[20%]">Ticker</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Payments</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[25%]">Total Received</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Avg/Share</th>
                    <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[25%]">Latest Date</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-1 group relative">
                          <DollarSign className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className="text-white font-medium text-sm">{item.ticker}</span>
                          <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          
                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {item.tickerName}
                          </div>
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
                        {formatDate(item.latestDate)}
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