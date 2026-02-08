'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/app/lib/types/transaction';
import { getPositions } from '@/app/services/positionServiceClient';
import { ReducePositionPlanner } from './ReducePositionPlanner';
import { IncreasePositionPlanner } from './IncreasePositionPlanner';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';
import { ChevronDown, ChevronUp, ChartAreaIcon, ChartBarIcon, ListPlusIcon } from 'lucide-react';

export function PositionActions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [actionType, setActionType] = useState<'increase' | 'reduce' | null>(null);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [viewingPlan, setViewingPlan] = useState<any | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [viewMode, setViewMode] = useState<'by-position' | 'all-plans'>('by-position');
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loadingAllPlans, setLoadingAllPlans] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCardExpansion = (planId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  // Calculate expected gain/loss for a plan
  const calculatePlanGainLoss = (plan: any, position: Position) => {
    if (!plan.sell_shares || !plan.expected_proceeds) return null;

    const sellPrice = plan.expected_proceeds / plan.sell_shares;
    const costBasis = position.average_cost * plan.sell_shares;
    const gainLoss = (sellPrice - position.average_cost) * plan.sell_shares;
    const percentage = ((sellPrice - position.average_cost) / position.average_cost) * 100;

    return {
      amount: gainLoss,
      percentage: percentage,
      isPositive: gainLoss >= 0
    };
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      fetchSavedPlans();
    }
  }, [selectedPosition]);

  useEffect(() => {
    if (viewMode === 'all-plans') {
      fetchAllPlans();
    }
  }, [viewMode]);

  const fetchAllPlans = async () => {
    setLoadingAllPlans(true);
    try {
      const response = await fetch('/api/position-action-plans');
      const result = await response.json();
      setAllPlans(result.data || []);
    } catch (err) {
      console.error('Failed to fetch all plans:', err);
      setAllPlans([]);
    } finally {
      setLoadingAllPlans(false);
    }
  };

  const fetchSavedPlans = async () => {
    if (!selectedPosition) return;
    setLoadingPlans(true);
    try {
      const response = await fetch(`/api/position-action-plans?position_id=${selectedPosition.position_id}`);
      const result = await response.json();
      setSavedPlans(result.data || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setSavedPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await getPositions(true); // Only active positions
      setPositions(data);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading positions...</p>
      </div>
    );
  }

  return (
    <>
      {/* View Mode Toggle */}
      <div className="mb-6 inline-flex">
        <SegmentedPills
          options={[
            { value: 1, label: 'By Position', icon: <ChartBarIcon className="w-4 h-4" />, activeColor: 'bg-blue-500' },
            { value: 2, label: 'All Plans', icon: <ListPlusIcon className="w-4 h-4" />, activeColor: 'bg-cyan-500' },
          ]}
          value={viewMode === 'by-position' ? 1 : 2}
          onChange={(value) => setViewMode(value === 1 ? 'by-position' : 'all-plans')}
          showLabels={true}
        />
      </div>

      {/* By Position View */}
      {viewMode === 'by-position' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Positions List (30%) */}
          <div className="lg:w-[30%]">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Your Positions</h2>

              {positions.length === 0 ? (
                <p className="text-blue-200 text-sm text-center py-8">No active positions found</p>
              ) : (
                <div className="space-y-3">
                  {positions
                    .sort((a, b) => {
                      if (selectedPosition?.position_id === a.position_id) return -1;
                      if (selectedPosition?.position_id === b.position_id) return 1;
                      return 0;
                    })
                    .map((position) => (
                      <button
                        key={position.position_id}
                        onClick={() => {
                          setSelectedPosition(position);
                          setActionType(null);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedPosition?.position_id === position.position_id
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-bold text-lg">{position.ticker}</h3>
                          <span className="text-blue-200 text-xs">{position.position_currency}</span>
                        </div>
                        {position.ticker_name && (
                          <p className="text-blue-300 text-xs mb-2">{position.ticker_name}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-blue-300">Shares</p>
                            <p className="text-white font-semibold">{position.total_shares.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-blue-300">Avg Cost</p>
                            <p className="text-white font-semibold">${position.average_cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-blue-300">Current Price</p>
                            <p className="text-white font-semibold">
                              ${position.current_market_price?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-300">Value</p>
                            <p className="text-white font-semibold">
                              ${position.current_value?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <p className="text-xs text-blue-300">Unrealized P/L</p>
                          <p className={`font-bold ${(position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                            }`}>
                            ${position.unrealized_pnl?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* GRADIENT DIVIDER */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3" />

          {/* Right Panel - Action Selector or Planner (70%) */}
          <div className="lg:w-[70%]">
            {selectedPosition ? (
              <div className="space-y-6">
                {/* Saved Plans Section */}
                {!loadingPlans && savedPlans.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Saved Action Plans</h3>
                    <div className="space-y-3">
                      {savedPlans.map((plan) => (
                        <div
                          key={plan.plan_id}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.action_type === 'ADD_POSITION'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                {plan.action_type === 'ADD_POSITION' ? 'Increase' : 'Reduce'} Position
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.status === 'DRAFT'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : plan.status === 'EXECUTED'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-slate-500/20 text-slate-300'
                                }`}>
                                {plan.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewingPlan(plan)}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                                title="View plan"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPlan(plan);
                                  setActionType(plan.action_type === 'ADD_POSITION' ? 'increase' : 'reduce');
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                                title="Edit plan"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this action plan?')) {
                                    try {
                                      await fetch(`/api/position-action-plans?planId=${plan.plan_id}`, {
                                        method: 'DELETE'
                                      });
                                      setSavedPlans(prev => prev.filter(p => p.plan_id !== plan.plan_id));
                                      if (editingPlan?.plan_id === plan.plan_id) {
                                        setEditingPlan(null);
                                        setActionType(null);
                                      }
                                    } catch (err) {
                                      console.error('Failed to delete plan:', err);
                                    }
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                                title="Delete plan"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                            {plan.action_type === 'ADD_POSITION' ? (
                              <>
                                <div>
                                  <p className="text-blue-300 text-xs">Shares to Buy</p>
                                  <p className="text-white font-semibold">{plan.buy_shares?.toFixed(4) || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-blue-300 text-xs">Entry Price</p>
                                  <p className="text-white font-semibold">${plan.entry_price?.toFixed(2) || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-blue-300 text-xs">Investment Amount</p>
                                  <p className="text-white font-semibold">${((plan.buy_shares || 0) * (plan.entry_price || 0) + (plan.fees || 0)).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-blue-300 text-xs">New Avg Cost</p>
                                  <p className="text-white font-semibold">${plan.new_average_cost?.toFixed(2) || '-'}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-blue-300 text-xs">Sell Shares</p>
                                  <p className="text-white font-semibold">{plan.sell_shares?.toFixed(4) || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-blue-300 text-xs">Expected Proceeds</p>
                                  <p className="text-white font-semibold">${plan.expected_proceeds?.toFixed(2) || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-blue-300 text-xs">Expected Gain/Loss</p>
                                  {(() => {
                                    const gainLoss = calculatePlanGainLoss(plan, selectedPosition!);
                                    if (!gainLoss) return <p className="text-white font-semibold">-</p>;
                                    return (
                                      <p className={`font-semibold ${gainLoss.isPositive ? 'text-green-400' : 'text-rose-400'}`}>
                                        {gainLoss.isPositive ? '+' : ''}${gainLoss.amount.toFixed(2)} ({gainLoss.isPositive ? '+' : ''}{gainLoss.percentage.toFixed(1)}%)
                                      </p>
                                    );
                                  })()}
                                </div>
                                {plan.reinvest_ticker && (
                                  <div>
                                    <p className="text-green-300 text-xs">Reinvest To</p>
                                    <p className="text-white font-semibold">{plan.reinvest_ticker}</p>
                                  </div>
                                )}
                                {plan.withdraw_currency && (
                                  <div>
                                    <p className="text-purple-300 text-xs">Withdraw To</p>
                                    <p className="text-white font-semibold">{plan.withdraw_currency}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <p className="text-blue-300 text-xs">
                            {new Date(plan.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Type Selector */}
                {!actionType && (
                  <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedPosition.ticker}</h2>
                      <p className="text-blue-200">
                        {savedPlans.length > 0 ? 'Create a new action plan' : 'Choose an action for this position'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setActionType('increase')}
                        className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/30 rounded-2xl hover:border-green-400 hover:bg-green-500/30 transition-all group"
                      >
                        <div className="text-4xl mb-3">📈</div>
                        <h3 className="text-xl font-bold text-white mb-2">Increase Position</h3>
                        <p className="text-blue-200 text-sm">Plan additional investment and analyze impact</p>
                      </button>

                      <button
                        onClick={() => setActionType('reduce')}
                        className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 rounded-2xl hover:border-blue-400 hover:bg-blue-500/30 transition-all group"
                      >
                        <div className="text-4xl mb-3">📉</div>
                        <h3 className="text-xl font-bold text-white mb-2">Reduce Position</h3>
                        <p className="text-blue-200 text-sm">Plan liquidation, reinvestment, and withdrawal</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Planners */}
                {actionType === 'increase' && (
                  <IncreasePositionPlanner
                    position={selectedPosition}
                    editingPlan={editingPlan}
                    onSuccess={() => {
                      fetchSavedPlans();
                      fetchPositions();
                      setEditingPlan(null);
                    }}
                    onCancel={() => {
                      setActionType(null);
                      setEditingPlan(null);
                    }}
                  />
                )}
                {actionType === 'reduce' && (
                  <ReducePositionPlanner
                    position={selectedPosition}
                    editingPlan={editingPlan}
                    onSuccess={() => {
                      fetchSavedPlans();
                      fetchPositions();
                      setEditingPlan(null);
                    }}
                    onCancel={() => {
                      setActionType(null);
                      setEditingPlan(null);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-12 border border-white/20 text-center">
                <p className="text-blue-200 text-lg mb-2">Select a Position</p>
                <p className="text-blue-300 text-sm">Choose a position from the left to plan your actions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Plans View */}
      {viewMode === 'all-plans' && (
        <div className="w-full">
          {loadingAllPlans ? (
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
              <p className="text-blue-200 text-center">Loading all plans...</p>
            </div>
          ) : allPlans.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
              <p className="text-blue-200 text-center">No action plans found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {allPlans.map((plan) => {
                const isExpanded = expandedCards.has(plan.plan_id);

                return (
                  <div
                    key={plan.plan_id}
                    className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 hover:border-blue-400/50 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => toggleCardExpansion(plan.plan_id)}
                          className="p-2 rounded-full bg-white/10 text-blue-300 hover:bg-white/20 transition-all flex-shrink-0"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-lg">{plan.ticker}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.action_type === 'ADD_POSITION'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-blue-500/20 text-blue-300'
                              }`}>
                              {plan.action_type === 'ADD_POSITION' ? 'Increase' : 'Reduce'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.status === 'DRAFT'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : plan.status === 'EXECUTED'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-slate-500/20 text-slate-300'
                              }`}>
                              {plan.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setViewingPlan(plan)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                          title="View plan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPosition(positions.find(p => p.position_id === plan.position_id) || null);
                            setEditingPlan(plan);
                            setActionType(plan.action_type === 'ADD_POSITION' ? 'increase' : 'reduce');
                            setViewMode('by-position');
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                          title="Edit plan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this action plan?')) {
                              try {
                                await fetch(`/api/position-action-plans?planId=${plan.plan_id}`, {
                                  method: 'DELETE'
                                });
                                setAllPlans(prev => prev.filter(p => p.plan_id !== plan.plan_id));
                              } catch (err) {
                                console.error('Failed to delete plan:', err);
                              }
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                          title="Delete plan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <>
                        <div className="space-y-2 text-sm">
                          {plan.action_type === 'ADD_POSITION' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Shares to Buy</span>
                                <span className="text-white font-semibold">{plan.buy_shares?.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Entry Price</span>
                                <span className="text-white font-semibold">${plan.entry_price?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Investment Amount</span>
                                <span className="text-white font-semibold">${((plan.buy_shares || 0) * (plan.entry_price || 0) + (plan.fees || 0)).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">New Avg Cost</span>
                                <span className="text-white font-semibold">${plan.new_average_cost?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                                <span className="text-blue-300">Previous Dividend</span>
                                <span className="text-white font-semibold">${plan.previous_dividend?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Projected Dividend</span>
                                <span className={`font-semibold ${(plan.projected_dividend || 0) >= (plan.previous_dividend || 0) ? 'text-green-400' : 'text-rose-400'}`}>
                                  ${plan.projected_dividend?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Dividend Increase</span>
                                <span className={`font-semibold ${(plan.projected_dividend || 0) - (plan.previous_dividend || 0) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                  ${((plan.projected_dividend || 0) - (plan.previous_dividend || 0)).toFixed(2)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Sell Shares</span>
                                <span className="text-white font-semibold">{plan.sell_shares?.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Expected Proceeds</span>
                                <span className="text-white font-semibold">${plan.expected_proceeds?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-300">Expected Gain/Loss</span>
                                {(() => {
                                  const position = positions.find(p => p.position_id === plan.position_id);
                                  if (!position) return <span className="text-white font-semibold">-</span>;
                                  const gainLoss = calculatePlanGainLoss(plan, position);
                                  if (!gainLoss) return <span className="text-white font-semibold">-</span>;
                                  return (
                                    <span className={`font-semibold ${gainLoss.isPositive ? 'text-green-400' : 'text-rose-400'}`}>
                                      {gainLoss.isPositive ? '+' : ''}${gainLoss.amount.toFixed(2)} ({gainLoss.isPositive ? '+' : ''}{gainLoss.percentage.toFixed(1)}%)
                                    </span>
                                  );
                                })()}
                              </div>
                            </>
                          )}
                        </div>

                        <p className="text-blue-300 text-xs mt-3 pt-3 border-t border-white/10">
                          {new Date(plan.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View Plan Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Action Plan Details
                </h2>
                <p className="text-blue-200 text-sm">
                  {viewingPlan.ticker} - {viewingPlan.action_type === 'ADD_POSITION' ? 'Increase Position' : 'Reduce Position'}
                </p>
              </div>
              <button
                onClick={() => setViewingPlan(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${viewingPlan.action_type === 'ADD_POSITION'
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                }`}>
                {viewingPlan.action_type === 'ADD_POSITION' ? 'Increase Position' : 'Reduce Position'}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${viewingPlan.status === 'DRAFT'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                  : viewingPlan.status === 'EXECUTED'
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                }`}>
                {viewingPlan.status}
              </span>
            </div>

            <div className="space-y-4">
              {/* For ADD_POSITION */}
              {viewingPlan.action_type === 'ADD_POSITION' ? (
                <>
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Investment Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Shares to Buy</p>
                        <p className="text-white font-bold text-lg">{viewingPlan.buy_shares?.toFixed(4) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Entry Price</p>
                        <p className="text-white font-bold text-lg">${viewingPlan.entry_price?.toFixed(2) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Fees</p>
                        <p className="text-white font-bold text-lg">${viewingPlan.fees?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Investment Amount</p>
                        <p className="text-white font-bold text-lg">${((viewingPlan.buy_shares || 0) * (viewingPlan.entry_price || 0) + (viewingPlan.fees || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Position Impact</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm pb-3 border-b border-white/10">
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Current Shares</p>
                          <p className="text-white font-bold text-lg">{viewingPlan.total_shares?.toFixed(4) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Current Avg Cost</p>
                          <p className="text-white font-bold text-lg">${viewingPlan.average_cost?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-300 text-xs mb-1">New Total Shares</p>
                          <p className="text-white font-bold text-lg">{viewingPlan.new_total_shares?.toFixed(4) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-green-300 text-xs mb-1">New Avg Cost</p>
                          <p className="text-white font-bold text-lg">${viewingPlan.new_average_cost?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Dividend Impact</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Previous Dividend</p>
                        <p className="text-white font-bold text-lg">${viewingPlan.previous_dividend?.toFixed(2) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Projected Dividend</p>
                        <p className="text-white font-bold text-lg">${viewingPlan.projected_dividend?.toFixed(2) || '-'}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Liquidation Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Sell Shares</p>
                        <p className="text-white font-bold text-lg">{viewingPlan.sell_shares?.toFixed(4) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs mb-1">Expected Proceeds</p>
                        <p className="text-white font-bold text-lg">${viewingPlan.expected_proceeds?.toFixed(2) || '-'}</p>
                      </div>
                      {viewingPlan.action_type === 'PARTIAL_SELL' && (
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Sell Percentage</p>
                          <p className="text-white font-bold text-lg">{viewingPlan.sell_percentage}%</p>
                        </div>
                      )}
                    </div>

                    {/* Expected Gain/Loss */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-blue-300 text-xs mb-1">Expected Gain/Loss</p>
                      {(() => {
                        const position = positions.find(p => p.position_id === viewingPlan.position_id);
                        if (!position) return <p className="text-white font-bold text-lg">-</p>;
                        const gainLoss = calculatePlanGainLoss(viewingPlan, position);
                        if (!gainLoss) return <p className="text-white font-bold text-lg">-</p>;
                        return (
                          <p className={`font-bold text-lg ${gainLoss.isPositive ? 'text-green-400' : 'text-rose-400'}`}>
                            {gainLoss.isPositive ? '+' : ''}${gainLoss.amount.toFixed(2)} ({gainLoss.isPositive ? '+' : ''}{gainLoss.percentage.toFixed(1)}%)
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {viewingPlan.reinvest_ticker && (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-3">Reinvestment</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Ticker</p>
                          <p className="text-white font-bold text-lg">{viewingPlan.reinvest_ticker}</p>
                        </div>
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Amount</p>
                          <p className="text-white font-bold text-lg">${viewingPlan.reinvest_amount?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingPlan.withdraw_currency && (
                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-3">Withdrawal</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Amount</p>
                          <p className="text-white font-bold text-lg">${viewingPlan.withdraw_amount?.toFixed(2) || '-'}</p>
                        </div>
                        <div>
                          <p className="text-blue-300 text-xs mb-1">Currency</p>
                          <p className="text-white font-bold text-lg">{viewingPlan.withdraw_currency}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {viewingPlan.notes && (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
                  <div className="text-blue-200 text-sm">
                    <BulletDisplay text={viewingPlan.notes} />
                  </div>
                </div>
              )}

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-blue-300 text-xs mb-1">Created</p>
                <p className="text-white">
                  {new Date(viewingPlan.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}