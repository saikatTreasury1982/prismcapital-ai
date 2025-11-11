'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Info } from 'lucide-react';

interface TickerBreakdown {
  ticker: string;
  tickerName: string;
  totalPayments: number;
  totalReceived: number;
  avgPerShare: number;
  latestDate: string | null;
}

interface DividendCardProps {
  summary: {
    totalDividends: number;
    totalStocks: number;
    ytdDividends: number;
    ytdStocks: number;
    ytdPayments: number;
  };
  allTimeBreakdown: TickerBreakdown[];
  ytdBreakdown: TickerBreakdown[];
}

export default function DividendCard({ summary, allTimeBreakdown, ytdBreakdown }: DividendCardProps) {
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
            <th className="text-left text-blue-200 text-sm font-medium pb-3 w-[20%]">Ticker</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[15%]">Payments</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[25%]">Total Received</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Avg/Share</th>
            <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Latest Date</th>
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
                {formatDate(item.latestDate)}
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
        <h3 className="text-xl font-semibold text-white mb-4">Dividend Overview</h3>

        <div className="space-y-4">
          {/* Total Dividends Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setIsTotalExpanded(!isTotalExpanded)}
              className="w-full p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-blue-200 text-sm mb-1">Total Dividends</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {formatCurrency(summary.totalDividends)}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    {summary.totalStocks} stocks
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

          {/* Year-to-Date Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setIsYtdExpanded(!isYtdExpanded)}
              className="w-full p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-blue-200 text-sm mb-1">Year-to-Date</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(summary.ytdDividends)}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    {summary.ytdPayments} payments • {summary.ytdStocks} stocks
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
    </div>
  );
}