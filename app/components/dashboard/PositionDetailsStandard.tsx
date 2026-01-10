'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Info, ArrowUpDown } from 'lucide-react';
import MiniCharts from './MiniCharts';

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

interface PositionDetailsStandardProps {
  positions: Position[];
  chartData: ChartData[];
}

type SortField = 'ticker' | 'quantity' | 'averageCost' | 'capitalInvested' | 'daysHeld' | 'currentValue' | 'moneyness';
type SortDirection = 'asc' | 'desc';

export default function PositionDetailsStandard({ positions, chartData }: PositionDetailsStandardProps) {
  const [sortField, setSortField] = useState<SortField>('capitalInvested');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPositions = useMemo(() => {
    const sorted = [...positions].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string comparison for ticker
      if (sortField === 'ticker') {
        return sortDirection === 'asc' 
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string);
      }

      // Numeric comparison
      const numA = aValue as number;
      const numB = bValue as number;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [positions, sortField, sortDirection]);

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-blue-300 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <TrendingUp className="w-3 h-3 text-blue-400" />
    ) : (
      <TrendingDown className="w-3 h-3 text-blue-400" />
    );
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Position Details - Standard View</h3>
        
        {/* Mini Charts */}
        <div className="mb-8">
          <MiniCharts data={chartData} />
        </div>

        {/* Sortable Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[5%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    Ticker
                    <SortIcon field="ticker" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Quantity
                    <SortIcon field="quantity" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('averageCost')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg Cost
                    <SortIcon field="averageCost" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('capitalInvested')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Capital
                    <SortIcon field="capitalInvested" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('daysHeld')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Days Held
                    <SortIcon field="daysHeld" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('currentValue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Market Value
                    <SortIcon field="currentValue" />
                  </div>
                </th>
                <th 
                  className="text-left text-blue-200 text-sm font-medium py-3 w-[10%] cursor-pointer hover:text-white transition-colors align-middle"
                  onClick={() => handleSort('moneyness')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Moneyness
                    <SortIcon field="moneyness" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map((position, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/10 transition-colors"
                >
                  <td className="py-2">
                    <div className="flex items-center gap-1 group relative">
                      <DollarSign className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-white font-medium text-sm truncate">{position.ticker}</span>
                      <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      
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
  );
}