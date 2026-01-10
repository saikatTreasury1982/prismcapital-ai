'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Info, GripVertical, XCircle, Save } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent, closestCorners } from '@dnd-kit/core';
import GlassButton from '@/app/lib/ui/GlassButton';
import MiniCharts from './MiniCharts';

interface Position {
  position_id: number;
  ticker: string;
  total_shares: number;
  average_cost: number;
  current_market_price: number;
  unrealized_pnl: number;
  capital_invested: number;
  current_value: number;
  days_held: number;
  strategy_code: string;
}

interface Strategy {
  strategy_code: string;
  strategy_name: string;
  position_count: number;
  positions: Position[];
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

interface PositionDetailsByStrategyProps {
  strategies: Strategy[];
  chartData: ChartData[];
}

interface ConfirmationDialog {
  show: boolean;
  ticker: string;
  positionId: number;
  fromStrategy: string;
  toStrategy: string;
}

export default function PositionDetailsByStrategy({ 
  strategies: initialStrategies,
  chartData 
}: PositionDetailsByStrategyProps) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    show: false,
    ticker: '',
    positionId: 0,
    fromStrategy: '',
    toStrategy: '',
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const [positionId, fromStrategy] = (active.id as string).split('|');
    const toStrategy = over.id as string;

    if (fromStrategy === toStrategy) return;

    const fromStrategyData = strategies.find(s => s.strategy_code === fromStrategy);
    const position = fromStrategyData?.positions.find(p => p.position_id === parseInt(positionId));

    if (!position) return;

    setConfirmation({
      show: true,
      ticker: position.ticker,
      positionId: parseInt(positionId),
      fromStrategy,
      toStrategy,
    });
  };

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/positions/update-strategy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: confirmation.positionId,
          newStrategy: confirmation.toStrategy,
        }),
      });

      if (!response.ok) throw new Error('Failed to update strategy');

      setStrategies(prev => {
        const newStrategies = prev.map(strategy => {
          if (strategy.strategy_code === confirmation.fromStrategy) {
            return {
              ...strategy,
              positions: strategy.positions.filter(p => p.position_id !== confirmation.positionId),
              position_count: strategy.position_count - 1,
            };
          } else if (strategy.strategy_code === confirmation.toStrategy) {
            const fromStrategy = prev.find(s => s.strategy_code === confirmation.fromStrategy);
            const position = fromStrategy?.positions.find(p => p.position_id === confirmation.positionId);
            if (position) {
              return {
                ...strategy,
                positions: [...strategy.positions, position],
                position_count: strategy.position_count + 1,
              };
            }
          }
          return strategy;
        });
        return newStrategies;
      });

      setConfirmation({ show: false, ticker: '', positionId: 0, fromStrategy: '', toStrategy: '' });
    } catch (error) {
      console.error('Error updating strategy:', error);
      alert('Failed to update strategy');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setConfirmation({ show: false, ticker: '', positionId: 0, fromStrategy: '', toStrategy: '' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const activePosition = activeId
    ? strategies
        .flatMap(s => s.positions.map(p => ({ ...p, strategy: s.strategy_code })))
        .find(p => `${p.position_id}|${p.strategy}` === activeId)
    : null;

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Position Details - By Strategy</h3>
            
            {/* Mini Charts */}
            <MiniCharts data={chartData} />

            {/* Strategy Groups with Tables */}
            <div className="space-y-6">
              {strategies.map((strategy) => (
                <StrategyTableSection
                  key={strategy.strategy_code}
                  strategy={strategy}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activePosition && (
            <div className="bg-white/20 backdrop-blur-xl rounded-lg p-3 border-2 border-cyan-400 shadow-2xl">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-cyan-400" />
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold">{activePosition.ticker}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {confirmation.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Confirm Strategy Change</h3>
            <p className="text-blue-200 mb-6">
              Move <span className="text-white font-bold">{confirmation.ticker}</span> from{' '}
              <span className="text-cyan-400">{strategies.find(s => s.strategy_code === confirmation.fromStrategy)?.strategy_name}</span>{' '}
              to{' '}
              <span className="text-emerald-400">{strategies.find(s => s.strategy_code === confirmation.toStrategy)?.strategy_name}</span>?
            </p>
            
            {isUpdating && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-200 text-sm">Updating strategy...</span>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <GlassButton
                icon={XCircle}
                onClick={handleCancel}
                tooltip="Cancel"
                variant="secondary"
                size="lg"
                disabled={isUpdating}
              />
              <GlassButton
                icon={Save}
                onClick={handleConfirm}
                tooltip="Confirm"
                variant="primary"
                size="lg"
                disabled={isUpdating}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Droppable Strategy Table Section
function StrategyTableSection({ strategy, formatCurrency, formatNumber }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: strategy.strategy_code,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded-xl overflow-hidden ${
        isOver  
          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent'
          : ''
      }`}
    >
      {/* Strategy Header */}
      <div className="bg-white/5 border border-white/10 rounded-t-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold text-base">
            {strategy.strategy_name}
          </h4>
          <span className="text-blue-200 text-sm">
            {strategy.positions.length} {strategy.positions.length === 1 ? 'position' : 'positions'}
          </span>
        </div>
      </div>

      {/* Strategy Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left text-blue-200 text-sm font-medium pb-3 pt-3 pl-4 w-[5%]"></th>
              <th className="text-left text-blue-200 text-sm font-medium pb-3 pt-3 w-[10%]">Ticker</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 w-[10%]">Quantity</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 w-[12%]">Avg Cost</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 w-[14%]">Capital</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 w-[12%]">Days Held</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 w-[16%]">Market Value</th>
              <th className="text-right text-blue-200 text-sm font-medium pb-3 pt-3 pr-4 w-[16%]">Moneyness</th>
            </tr>
          </thead>
          <tbody>
            {strategy.positions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-blue-300 text-sm">
                  No positions in this strategy
                </td>
              </tr>
            ) : (
              strategy.positions.map((position: any) => (
                <DraggableTableRow
                  key={position.position_id}
                  position={position}
                  strategyCode={strategy.strategy_code}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Draggable Table Row
function DraggableTableRow({ position, strategyCode, formatCurrency, formatNumber }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${position.position_id}|${strategyCode}`,
  });

  return (
    <tr
      ref={setNodeRef}
      className={`border-b border-white/5 transition-all ${
        isDragging
          ? 'opacity-50 bg-cyan-500/20'
          : 'hover:bg-white/10'
      }`}
    >
      <td className="py-2 pl-4">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-blue-300 hover:text-white transition-colors" />
        </div>
      </td>
      <td className="py-2">
        <div className="flex items-center gap-1 group relative">
          <DollarSign className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-white font-medium text-sm">{position.ticker}</span>
          <Info className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          
          <div className="absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {position.ticker_name}
          </div>
        </div>
      </td>
      <td className="text-right text-white text-sm py-2">{formatNumber(position.total_shares)}</td>
      <td className="text-right text-white text-sm py-2">
        {formatCurrency(position.average_cost)}
      </td>
      <td className="text-right text-white text-sm py-2">
        {formatCurrency(position.capital_invested || position.average_cost * position.total_shares)}
      </td>
      <td className="text-right text-blue-200 text-sm py-2">
        {position.days_held || 0} days
      </td>
      <td className="text-right text-white text-sm py-2">
        {formatCurrency(position.current_value || position.current_market_price * position.total_shares)}
      </td>
      <td className="text-right py-2 pr-4">
        <div className={`font-medium text-sm flex items-center justify-end gap-1 ${
          position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {position.unrealized_pnl >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatCurrency(position.unrealized_pnl)}
        </div>
        <div className={`text-xs font-medium ${
          position.unrealized_pnl >= 0 ? 'text-green-300' : 'text-red-300'
        }`}>
          {(() => {
            const costBasis = position.average_cost * position.total_shares;
            const percentage = costBasis > 0 ? (position.unrealized_pnl / costBasis) * 100 : 0;
            return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
          })()}
        </div>
      </td>
    </tr>
  );
}