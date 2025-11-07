'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Target, DollarSign, Info } from 'lucide-react';

interface Position {
  ticker: string;
  tickerName: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  unrealizedPnl: number;
  currency: string;
}

interface Strategy {
  strategyId: number;
  strategyName: string;
  strategyDescription: string;
  positionCount: number;
  positions: Position[];
}

interface TradeStrategyCardProps {
  strategies: Strategy[];
}

export default function TradeStrategyCard({ strategies }: TradeStrategyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getStrategyColor = (strategyName: string) => {
    const colors: { [key: string]: string } = {
      'Day Trade': 'text-red-400',
      'Swing Trade': 'text-orange-400',
      'Position Trade': 'text-blue-400',
      'Long-Term Hold': 'text-emerald-400',
    };
    return colors[strategyName] || 'text-white';
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
      {/* Summary Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Trade Strategy Overview
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {strategies.map((strategy, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-1 mb-1 group relative">
                <p className="text-blue-200 text-xs">{strategy.strategyName}</p>
                <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal max-w-xs z-10 shadow-lg">
                  {strategy.strategyDescription}
                </div>
              </div>
              <p className={`text-2xl font-bold ${getStrategyColor(strategy.strategyName)}`}>
                {strategy.positionCount}
              </p>
              <p className="text-blue-200 text-xs mt-1">positions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="border-t border-white/10">
          <div className="p-6 space-y-6">
            {strategies.map((strategy, strategyIndex) => (
              <div key={strategyIndex}>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className={getStrategyColor(strategy.strategyName)}>
                    {strategy.strategyName}
                  </span>
                  <span className="text-blue-200 text-sm">({strategy.positionCount})</span>
                </h4>
                
                <div>
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-blue-200 text-sm font-medium pb-3 w-[15%]">Ticker</th>
                        <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[15%]">Quantity</th>
                        <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Avg Cost</th>
                        <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Current Price</th>
                        <th className="text-right text-blue-200 text-sm font-medium pb-3 w-[20%]">Moneyness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategy.positions.map((position, posIndex) => (
                        <tr
                          key={posIndex}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-2">
                            <div className="flex items-center gap-1 group relative">
                              <DollarSign className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-white font-medium text-sm truncate">{position.ticker}</span>
                              <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              
                              {/* Tooltip */}
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
                            {formatCurrency(position.currentPrice, position.currency)}
                          </td>
                          <td
                            className={`text-right font-medium text-sm py-2 ${
                              position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {formatCurrency(position.unrealizedPnl, position.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}