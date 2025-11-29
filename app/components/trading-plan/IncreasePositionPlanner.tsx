'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Save } from 'lucide-react';
import { Position } from '@/app/lib/types/transaction';
import { createPositionActionPlan, updatePositionActionPlan } from '@/app/services/positionActionPlanServiceClient';

interface IncreasePositionPlannerProps {
  position: Position;
  editingPlan?: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function IncreasePositionPlanner({ position, editingPlan, onSuccess, onCancel }: IncreasePositionPlannerProps) {
  const [buyShares, setBuyShares] = useState(0);
  const [entryPrice, setEntryPrice] = useState(position.current_market_price || position.average_cost);
  const [fees, setFees] = useState(0);
  const [notes, setNotes] = useState('');
  const [lastDividendPerShare, setLastDividendPerShare] = useState(0);
  
  const [isLoadingDividend, setIsLoadingDividend] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);
  const [viewingScenario, setViewingScenario] = useState<any | null>(null);

  // Fetch latest dividend
  useEffect(() => {
    const fetchDividend = async () => {
      setIsLoadingDividend(true);
      try {
        const response = await fetch(`/api/dividends/latest?ticker=${position.ticker}`);
        const result = await response.json();
        setLastDividendPerShare(result.data?.last_dividend_per_share || 0);
      } catch (err) {
        console.error('Failed to fetch dividend:', err);
        setLastDividendPerShare(0);
      } finally {
        setIsLoadingDividend(false);
      }
    };

    fetchDividend();
  }, [position.ticker]);

  useEffect(() => {
    if (editingPlan) {
      setBuyShares(editingPlan.buy_shares || 0);
      setEntryPrice(editingPlan.entry_price || position.current_market_price || position.average_cost);
      setFees(editingPlan.fees || 0);
      setNotes(editingPlan.notes || '');
      setLastDividendPerShare(editingPlan.last_dividend_per_share || 0);
    }
  }, [editingPlan, position]);

  // Fetch saved scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      setLoadingScenarios(true);
      try {
        const response = await fetch(`/api/position-action-plans?position_id=${position.position_id}`);
        const result = await response.json();
        const increaseScenarios = (result.data || []).filter((s: any) => s.action_type === 'ADD_POSITION');
        setSavedScenarios(increaseScenarios);
      } catch (err) {
        console.error('Failed to fetch scenarios:', err);
      } finally {
        setLoadingScenarios(false);
      }
    };

    fetchScenarios();
  }, [position.position_id]);

  // Calculate new metrics
  const totalInvestmentAmount = (buyShares * entryPrice) + fees;
  const previousTotalCost = position.average_cost * position.total_shares;
  const newTotalCost = previousTotalCost + totalInvestmentAmount;
  const newTotalShares = position.total_shares + buyShares;
  const newAverageCost = newTotalCost / newTotalShares;
  const costSavings = position.average_cost - newAverageCost;
  
  const previousDividend = lastDividendPerShare * position.total_shares;
  const projectedDividend = lastDividendPerShare * newTotalShares;
  const dividendIncrease = projectedDividend - previousDividend;

  const handleLoadScenario = (scenario: any) => {
    setBuyShares(scenario.buy_shares || 0);
    setEntryPrice(scenario.entry_price || position.current_market_price || position.average_cost);
    setFees(scenario.fees || 0);
    setNotes(scenario.notes || '');
    setEditingScenario(scenario);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setBuyShares(0);
    setEntryPrice(position.current_market_price || position.average_cost);
    setFees(0);
    setNotes('');
    setEditingScenario(null);
  };

  const handleSaveScenario = async () => {
    setError(null);
    setIsSaving(true);

    try {
      if (editingPlan) {
        await updatePositionActionPlan(editingPlan.plan_id, {
          action_type: 'ADD_POSITION',
          buy_shares: buyShares,
          entry_price: entryPrice,
          fees: fees || undefined,
          new_total_shares: newTotalShares,
          new_average_cost: newAverageCost,
          last_dividend_per_share: lastDividendPerShare,
          projected_dividend: projectedDividend,
          previous_dividend: previousDividend,
          notes: notes || undefined,
        });
        alert('Scenario updated successfully!');
      } else {
        await createPositionActionPlan({
          position_id: position.position_id,
          action_type: 'ADD_POSITION',
          buy_shares: buyShares,
          entry_price: entryPrice,
          fees: fees || undefined,
          new_total_shares: newTotalShares,
          new_average_cost: newAverageCost,
          last_dividend_per_share: lastDividendPerShare,
          projected_dividend: projectedDividend,
          previous_dividend: previousDividend,
          notes: notes || undefined,
        });
        alert('Scenario saved successfully!');
      }

      const response = await fetch(`/api/position-action-plans?position_id=${position.position_id}`);
      const result = await response.json();
      const increaseScenarios = (result.data || []).filter((s: any) => s.action_type === 'ADD_POSITION');
      setSavedScenarios(increaseScenarios);

      handleCancelEdit();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save scenario');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {editingScenario ? 'Edit Scenario' : 'Increase Position'} for {position.ticker}
            </h2>
            <p className="text-blue-200 text-sm">
              {editingScenario ? 'Update your saved scenario' : 'Plan additional investment and analyze impact on your position'}
            </p>
          </div>
          {editingPlan && (
            <button
              onClick={() => {
                handleCancelEdit();
                onCancel?.();
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="backdrop-blur-xl bg-rose-500/20 border border-rose-400/30 rounded-2xl p-4">
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {/* Investment Input Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-400/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Additional Investment</h3>
            <p className="text-blue-200 text-sm">Plan how many shares to buy at what price</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Shares to Buy <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              value={buyShares || ''}
              onChange={(e) => setBuyShares(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.0000"
            />
          </div>
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Entry Price <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={entryPrice || ''}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Fees (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={fees || ''}
              onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Total Investment Amount</p>
            <p className="text-white text-2xl font-bold">${totalInvestmentAmount.toFixed(2)}</p>
            <p className="text-blue-300 text-xs mt-1">{position.position_currency}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Current Avg Cost</p>
            <p className="text-white text-2xl font-bold">${position.average_cost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* New Position Metrics Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl p-6 border border-blue-400/20">
        <h3 className="text-xl font-bold text-white mb-4">New Position Metrics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">New Total Shares</p>
            <p className="text-white text-xl font-bold">{newTotalShares.toFixed(4)}</p>
            <p className="text-green-300 text-xs mt-1">+{buyShares.toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">New Avg Cost</p>
            <p className="text-white text-xl font-bold">${newAverageCost.toFixed(2)}</p>
            <p className={`text-xs mt-1 ${costSavings >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
              {costSavings >= 0 ? '-' : '+'}${Math.abs(costSavings).toFixed(2)}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Previous Dividend</p>
            <p className="text-white text-xl font-bold">${previousDividend.toFixed(2)}</p>
            <p className="text-blue-300 text-xs mt-1">@ {lastDividendPerShare.toFixed(4)}/share</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Projected Dividend</p>
            <p className="text-white text-xl font-bold">${projectedDividend.toFixed(2)}</p>
            <p className={`text-xs mt-1 ${dividendIncrease >= 0 ? 'text-green-300' : 'text-rose-300'}`}>
              +${dividendIncrease.toFixed(2)}
            </p>
          </div>
        </div>

        {isLoadingDividend && (
          <p className="text-blue-200 text-sm">Loading dividend information...</p>
        )}
      </div>

      {/* Notes */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
        <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this investment scenario..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveScenario}
        disabled={isSaving || buyShares <= 0 || entryPrice <= 0 || newTotalShares <= 0}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {isSaving ? (editingScenario ? 'Updating...' : 'Saving...') : (editingScenario ? 'Update Scenario' : 'Save Scenario')}
      </button>

      {/* View Scenario Modal */}
      {viewingScenario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Scenario Details
                </h2>
                <p className="text-blue-200 text-sm">
                  {position.ticker} - Increase Position
                </p>
              </div>
              <button
                onClick={() => setViewingScenario(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Investment Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-300 text-xs mb-1">Shares to Buy</p>
                    <p className="text-white font-bold">{viewingScenario.buy_shares?.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs mb-1">Entry Price</p>
                    <p className="text-white font-bold">${viewingScenario.entry_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs mb-1">Fees</p>
                    <p className="text-white font-bold">${viewingScenario.fees?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Position Impact</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-300 text-xs mb-1">New Total Shares</p>
                    <p className="text-white font-bold">{viewingScenario.new_total_shares?.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs mb-1">New Avg Cost</p>
                    <p className="text-white font-bold">${viewingScenario.new_average_cost?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Dividend Impact</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-300 text-xs mb-1">Previous Dividend</p>
                    <p className="text-white font-bold">${viewingScenario.previous_dividend?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-xs mb-1">Projected Dividend</p>
                    <p className="text-white font-bold">${viewingScenario.projected_dividend?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {viewingScenario.notes && (
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
                  <p className="text-blue-200 text-sm">{viewingScenario.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setViewingScenario(null);
                  handleLoadScenario(viewingScenario);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Edit Scenario
              </button>
              <button
                onClick={() => setViewingScenario(null)}
                className="px-6 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}