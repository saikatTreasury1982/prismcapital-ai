'use client';

import { useState, useMemo } from 'react';
import { DollarSign, Info, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { NotesPopover } from '@/app/lib/ui/NotesPopover';
import MiniCharts from './MiniCharts';

interface TickerBreakdown {
  ticker: string;
  tickerName: string;
  totalPayments: number;
  totalReceived: number;
  avgPerShare: number;
  marketYield: number;
  personalYield: number;
  exDivDates: string[];
  paymentDates: string[];
}

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

interface DividendBreakdownTableProps {
  data: TickerBreakdown[];
  chartData: ChartData[];
  title: string;
  displayCurrency: string;
  fxRate: number;
}

type SortField = 'ticker' | 'totalPayments' | 'totalReceived' | 'avgPerShare' | 'marketYield' | 'personalYield';
type SortDirection = 'asc' | 'desc';

export default function DividendBreakdownTable({ data, chartData, title, displayCurrency, fxRate }: DividendBreakdownTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalReceived');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'ticker') {
        return sortDirection === 'asc' 
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string);
      }

      const numA = aValue as number;
      const numB = bValue as number;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [data, sortField, sortDirection]);

  const formatCurrency = (value: number) => {
    const converted = value * fxRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-blue-300 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <TrendingUp className="w-3 h-3 text-amber-400" />
    ) : (
      <TrendingDown className="w-3 h-3 text-amber-400" />
    );
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        
        {/* Mini Charts */}
        <MiniCharts data={chartData} displayCurrency={displayCurrency} fxRate={fxRate} />

        {/* Sortable Table */}
        {sortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-blue-300">No dividend data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th 
                    className="text-left text-blue-200 text-sm font-medium pb-3 w-[12%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('ticker')}
                  >
                    <div className="flex items-center gap-1">
                      Ticker
                      <SortIcon field="ticker" />
                    </div>
                  </th>
                  <th 
                    className="text-center text-blue-200 text-sm font-medium pb-3 w-[10%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('totalPayments')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Payments
                      <SortIcon field="totalPayments" />
                    </div>
                  </th>
                  <th 
                    className="text-right text-blue-200 text-sm font-medium pb-3 w-[15%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('totalReceived')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Received
                      <SortIcon field="totalReceived" />
                    </div>
                  </th>
                  <th 
                    className="text-right text-blue-200 text-sm font-medium pb-3 w-[13%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('avgPerShare')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg/Share
                      <SortIcon field="avgPerShare" />
                    </div>
                  </th>
                  <th 
                    className="text-right text-blue-200 text-sm font-medium pb-3 w-[10%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('marketYield')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Market Yield
                      <SortIcon field="marketYield" />
                    </div>
                  </th>
                  <th 
                    className="text-right text-blue-200 text-sm font-medium pb-3 w-[11%] cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('personalYield')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Personal Yield
                      <SortIcon field="personalYield" />
                    </div>
                  </th>
                  <th className="text-center text-blue-200 text-sm font-medium pb-3 w-[12%]">
                    Ex-Div Dates
                  </th>
                  <th className="text-center text-blue-200 text-sm font-medium pb-3 w-[12%]">
                    Payment Dates
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <td className="py-2 pl-2">
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
                    <td className="text-center text-white text-sm py-2">{item.totalPayments}</td>
                    <td className="text-right text-amber-400 font-medium text-sm py-2 pr-4">
                      {formatCurrency(item.totalReceived)}
                    </td>
                    <td className="text-right text-white text-sm py-2 pr-4">
                      {formatCurrency(item.avgPerShare)}
                    </td>
                    <td className="text-right text-blue-300 text-sm py-2 pr-4">
                      {formatPercent(item.marketYield)}
                    </td>
                    <td className="text-right text-emerald-300 text-sm py-2 pr-4">
                      {formatPercent(item.personalYield)}
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center">
                        <NotesPopover
                          notes={item.exDivDates.length > 0 ? item.exDivDates.map(date => formatDate(date)).join('\n') : null}
                          title={`Ex-Div Dates - ${item.ticker}`}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center">
                        <NotesPopover
                          notes={item.paymentDates.length > 0 ? item.paymentDates.map(date => formatDate(date)).join('\n') : null}
                          title={`Payment Dates - ${item.ticker}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}