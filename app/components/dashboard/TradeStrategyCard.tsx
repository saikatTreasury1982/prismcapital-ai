'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ChevronUp, ChevronDown, GitBranch } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from '@dnd-kit/core';
import GlassButton from '@/app/lib/ui/GlassButton';
import { XCircle, Save } from 'lucide-react';

interface Strategy {
  strategy_code: string;
  strategy_name: string;
  position_count: number;
  positions: {
    position_id: number;
    ticker: string;
    total_shares: number;
    average_cost: number;
    current_market_price: number;
    unrealized_pnl: number;
  }[];
}

interface TradeStrategyCardProps {
  strategies: Strategy[];
}

interface ConfirmationDialog {
  show: boolean;
  ticker: string;
  positionId: number;
  fromStrategy: string;
  toStrategy: string;
}

export default function TradeStrategyCard({ strategies: initialStrategies }: TradeStrategyCardProps) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set()); // ✅ Add this
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

    // Don't do anything if dropped on same strategy
    if (fromStrategy === toStrategy) return;

    // Find the position details
    const fromStrategyData = strategies.find(s => s.strategy_code === fromStrategy);
    const position = fromStrategyData?.positions.find(p => p.position_id === parseInt(positionId));

    if (!position) return;

    // Show confirmation dialog
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

      // Update local state
      setStrategies(prev => {
        const newStrategies = prev.map(strategy => {
          if (strategy.strategy_code === confirmation.fromStrategy) {
            // Remove from old strategy
            return {
              ...strategy,
              positions: strategy.positions.filter(p => p.position_id !== confirmation.positionId),
              position_count: strategy.position_count - 1,
            };
          } else if (strategy.strategy_code === confirmation.toStrategy) {
            // Add to new strategy
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

  // Get the position being dragged
  const activePosition = activeId
    ? strategies
        .flatMap(s => s.positions.map(p => ({ ...p, strategy: s.strategy_code })))
        .find(p => `${p.position_id}|${p.strategy}` === activeId)
    : null;

  return (
  <>
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
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

          <div className="grid grid-cols-2 gap-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.strategy_code}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <p className="text-blue-200 text-sm mb-1">{strategy.strategy_name}</p>
                <p className="text-white text-2xl font-bold">{strategy.position_count}</p>
                <p className="text-blue-300 text-xs mt-1">positions</p>
              </div>
            ))}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-white/10">
            <div className="p-6">
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <StrategySection
                    key={strategy.strategy_code}
                    strategy={strategy}
                    formatCurrency={formatCurrency}
                    isExpanded={expandedStrategies.has(strategy.strategy_code)}
                    onToggle={() => {
                      setExpandedStrategies(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(strategy.strategy_code)) {
                          newSet.delete(strategy.strategy_code);
                        } else {
                          newSet.add(strategy.strategy_code);
                        }
                        return newSet;
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {activePosition && (
          <div className="bg-white/20 backdrop-blur-xl rounded-xl p-3 border-2 border-cyan-400 shadow-lg cursor-grabbing">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold">{activePosition.ticker}</span>
              </div>
              <span className={`font-medium ${activePosition.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(activePosition.unrealized_pnl)}
              </span>
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

// Draggable Position Row Component
function DraggablePosition({ position, strategyCode, formatCurrency }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${position.position_id}|${strategyCode}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'bg-white/20 border-cyan-400 shadow-lg opacity-50'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-2 min-w-[100px]">
        <DollarSign className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-white font-medium">{position.ticker}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right min-w-[80px]">
          <p className="text-blue-200 text-xs whitespace-nowrap">Quantity</p>
          <p className="text-white text-sm font-medium">{position.total_shares.toFixed(2)}</p>
        </div>
        <div className="text-right min-w-[90px]">
          <p className="text-blue-200 text-xs whitespace-nowrap">Avg Cost</p>
          <p className="text-white text-sm">{formatCurrency(position.average_cost)}</p>
        </div>
        <div className="text-right min-w-[100px]">
          <p className="text-blue-200 text-xs whitespace-nowrap">Current Price</p>
          <p className="text-white text-sm">{formatCurrency(position.current_market_price)}</p>
        </div>
        <div className="text-right min-w-[120px]">
          <p className="text-blue-200 text-xs whitespace-nowrap mb-1">Moneyness</p>
          <p className={`text-sm font-bold flex items-center justify-end gap-1 ${
            position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {position.unrealized_pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatCurrency(position.unrealized_pnl)}
          </p>
          <p className={`text-xs font-medium ${
            position.unrealized_pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}>
            {(() => {
              const costBasis = position.average_cost * position.total_shares;
              const percentage = costBasis > 0 ? (position.unrealized_pnl / costBasis) * 100 : 0;
              return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Droppable Strategy Section Component
function StrategySection({ strategy, formatCurrency, isExpanded, onToggle }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: strategy.strategy_code,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded-xl overflow-hidden ${
        isOver  
          ? 'bg-cyan-500/20 border-2 border-cyan-400'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {/* Strategy Header - Clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h4 className="text-white font-semibold">
              {strategy.strategy_name}
            </h4>
            <p className="text-blue-200 text-xs mt-1">
              {strategy.positions.length} {strategy.positions.length === 1 ? 'position' : 'positions'}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {/* Strategy Positions - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="space-y-2 mt-4">
            {strategy.positions.length === 0 ? (
              <p className="text-blue-300 text-sm text-center py-4">No positions in this strategy</p>
            ) : (
              strategy.positions.map((position: any) => (
                <DraggablePosition
                  key={position.position_id}
                  position={position}
                  strategyCode={strategy.strategy_code}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}