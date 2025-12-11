'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, Save } from 'lucide-react';
import { Position } from '@/app/lib/types/transaction';
import { convertCurrency, createPositionActionPlan, updatePositionActionPlan } from '@/app/services/positionActionPlanServiceClient';
import GlassButton from '@/app/lib/ui/GlassButton';
import { XCircle } from 'lucide-react';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';

interface ReducePositionPlannerProps {
  position: Position;
  editingPlan?: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReducePositionPlanner({ position, editingPlan, onSuccess, onCancel }: ReducePositionPlannerProps) {
  // Step 1: Liquidation
  const [liquidationType, setLiquidationType] = useState<'full' | 'partial'>('full');
  const [nextAction, setNextAction] = useState<'none' | 'reinvest' | 'withdraw'>('none'); // Add this line
  const [sellPercentage, setSellPercentage] = useState(100);
  const [fees, setFees] = useState(0);
  const [sellShares, setSellShares] = useState(position.total_shares);
  const [targetSellPrice, setTargetSellPrice] = useState(position.current_market_price || position.average_cost); // Add this line
  const [proceeds, setProceeds] = useState(0);

  // Step 2: Reinvestment
  const [reinvestTicker, setReinvestTicker] = useState('');
  const [reinvestAmount, setReinvestAmount] = useState(0);
  const [reinvestPrice, setReinvestPrice] = useState(0);
  const [estimatedShares, setEstimatedShares] = useState(0);

  // Step 3: Withdrawal
  const [withdrawCurrency, setWithdrawCurrency] = useState('AUD');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);

  // UI State
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);
  const [viewingScenario, setViewingScenario] = useState<any | null>(null);

  // Calculate proceeds when liquidation changes
  useEffect(() => {
    const sharesToSell = liquidationType === 'full' ? position.total_shares : sellShares;
    const grossProceeds = sharesToSell * targetSellPrice; // Changed from currentPrice to targetSellPrice
    const netProceeds = grossProceeds - fees;
    setProceeds(Math.max(0, netProceeds));
  }, [liquidationType, sellShares, fees, targetSellPrice, position]); // Added targetSellPrice to dependencies

  // Update sell shares when percentage changes
  useEffect(() => {
    if (liquidationType === 'partial') {
      const shares = (position.total_shares * sellPercentage) / 100;
      setSellShares(parseFloat(shares.toFixed(4)));
    } else {
      setSellShares(position.total_shares);
    }
  }, [sellPercentage, liquidationType, position.total_shares]);

  // Calculate remaining cash after reinvestment
  const remainingCash = proceeds - reinvestAmount;

  // Calculate estimated shares for reinvestment
  useEffect(() => {
    if (reinvestPrice > 0 && reinvestAmount > 0) {
      setEstimatedShares(reinvestAmount / reinvestPrice);
    } else {
      setEstimatedShares(0);
    }
  }, [reinvestAmount, reinvestPrice]);

  // Convert currency when withdrawal amount changes
  useEffect(() => {
    const convertAmount = async () => {
      if (remainingCash > 0 && withdrawCurrency !== position.position_currency) {
        setIsLoadingConversion(true);
        try {
          const result = await convertCurrency(
            position.position_currency || 'USD',
            withdrawCurrency,
            remainingCash
          );
          setConvertedAmount(result.convertedAmount);
          setExchangeRate(result.rate);
        } catch (err) {
          console.error('Currency conversion failed:', err);
        } finally {
          setIsLoadingConversion(false);
        }
      } else {
        setConvertedAmount(remainingCash);
        setExchangeRate(1);
      }
    };

    convertAmount();
  }, [remainingCash, withdrawCurrency, position.position_currency]);

  // Fetch saved scenarios for this position
  useEffect(() => {
    const fetchScenarios = async () => {
      setLoadingScenarios(true);
      try {
        const response = await fetch(`/api/position-action-plans?position_id=${position.position_id}`);
        const result = await response.json();
        setSavedScenarios(result.data || []);
      } catch (err) {
        console.error('Failed to fetch scenarios:', err);
      } finally {
        setLoadingScenarios(false);
      }
    };

    fetchScenarios();
  }, [position.position_id]);

  useEffect(() => {
    if (editingPlan) {
      setLiquidationType(editingPlan.action_type === 'LIQUIDATE' ? 'full' : 'partial');
      setSellPercentage(editingPlan.sell_percentage || 100);
      setSellShares(editingPlan.sell_shares || position.total_shares);
      setTargetSellPrice(editingPlan.expected_proceeds ? editingPlan.expected_proceeds / editingPlan.sell_shares : position.current_market_price || position.average_cost);
      setProceeds(editingPlan.expected_proceeds || 0);
      
      if (editingPlan.reinvest_ticker) {
        setNextAction('reinvest');
        setReinvestTicker(editingPlan.reinvest_ticker);
        setReinvestAmount(editingPlan.reinvest_amount || 0);
      } else if (editingPlan.withdraw_currency) {
        setNextAction('withdraw');
        setWithdrawCurrency(editingPlan.withdraw_currency);
      } else {
        setNextAction('none');
      }
      
      setNotes(editingPlan.notes || '');
    }
  }, [editingPlan, position]);

  const handleLoadScenario = (scenario: any) => {
    // Populate form with scenario data
    setLiquidationType(scenario.action_type === 'LIQUIDATE' ? 'full' : 'partial');
    setSellPercentage(scenario.sell_percentage || 100);
    setSellShares(scenario.sell_shares || position.total_shares);
    setTargetSellPrice(scenario.expected_proceeds ? scenario.expected_proceeds / scenario.sell_shares : position.current_market_price || position.average_cost);
    setProceeds(scenario.expected_proceeds || 0);
    
    // Determine next action based on scenario data
    if (scenario.reinvest_ticker) {
      setNextAction('reinvest');
      setReinvestTicker(scenario.reinvest_ticker);
      setReinvestAmount(scenario.reinvest_amount || 0);
    } else if (scenario.withdraw_currency) {
      setNextAction('withdraw');
      setWithdrawCurrency(scenario.withdraw_currency);
    } else {
      setNextAction('none');
    }
    
    setNotes(scenario.notes || '');
    setEditingScenario(scenario);
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    // Reset form to defaults
    setLiquidationType('full');
    setNextAction('none');
    setSellPercentage(100);
    setSellShares(position.total_shares);
    setTargetSellPrice(position.current_market_price || position.average_cost);
    setFees(0);
    setReinvestTicker('');
    setReinvestAmount(0);
    setReinvestPrice(0);
    setNotes('');
    setEditingScenario(null);
  };

  const handleSaveScenario = async () => {
    setError(null);
    setIsSaving(true);

    try {
      if (editingScenario) {
        // Update existing scenario - don't include position_id
        await updatePositionActionPlan(editingScenario.plan_id, {
          action_type: liquidationType === 'full' ? 'LIQUIDATE' : 'PARTIAL_SELL',
          sell_percentage: liquidationType === 'partial' ? sellPercentage : 100,
          sell_shares: sellShares,
          expected_proceeds: proceeds,
          reinvest_ticker: nextAction === 'reinvest' && reinvestTicker ? reinvestTicker : null,
          reinvest_amount: nextAction === 'reinvest' && reinvestAmount > 0 ? reinvestAmount : null,
          withdraw_amount: nextAction === 'withdraw' && remainingCash > 0 ? remainingCash : null,
          withdraw_currency: nextAction === 'withdraw' ? withdrawCurrency : null,
          notes: notes || undefined,
        });
        alert('Scenario updated successfully!');
      } else {
        // Create new scenario - include position_id
        await createPositionActionPlan({
          position_id: position.position_id,
          action_type: liquidationType === 'full' ? 'LIQUIDATE' : 'PARTIAL_SELL',
          sell_percentage: liquidationType === 'partial' ? sellPercentage : 100,
          sell_shares: sellShares,
          expected_proceeds: proceeds,
          reinvest_ticker: nextAction === 'reinvest' && reinvestTicker ? reinvestTicker : undefined,
          reinvest_amount: nextAction === 'reinvest' && reinvestAmount > 0 ? reinvestAmount : undefined,
          withdraw_amount: nextAction === 'withdraw' && remainingCash > 0 ? remainingCash : undefined,
          withdraw_currency: nextAction === 'withdraw' ? withdrawCurrency : undefined,
          notes: notes || undefined,
        });
        alert('Scenario saved successfully!');
      }

      // Refresh scenarios list
      const response = await fetch(`/api/position-action-plans?position_id=${position.position_id}`);
      const result = await response.json();
      setSavedScenarios(result.data || []);

      // Reset form
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
              {editingScenario ? 'Edit Scenario' : 'Action Plan'} for {position.ticker}
            </h2>
            <p className="text-blue-200 text-sm">
              {editingScenario ? 'Update your saved scenario' : 'Plan your liquidation, reinvestment, and withdrawal strategy'}
            </p>
          </div>
          <div className="flex gap-2">
            <GlassButton
              icon={XCircle}
              onClick={() => {
                handleCancelEdit();
                onCancel?.();
              }}
              tooltip="Cancel"
              variant="secondary"
              size="md"
            />
            <GlassButton
              icon={Save}
              onClick={handleSaveScenario}
              disabled={isSaving || proceeds <= 0}
              tooltip={isSaving ? (editingScenario ? 'Updating...' : 'Saving...') : (editingScenario ? 'Update Scenario' : 'Save Scenario')}
              variant="primary"
              size="md"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="backdrop-blur-xl bg-rose-500/20 border border-rose-400/30 rounded-2xl p-4">
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {/* Card 1: Liquidate */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-6 border border-blue-400/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Step 1: Liquidate Position</h3>
            <p className="text-blue-200 text-sm">Choose how much to sell</p>
          </div>
        </div>

        {/* Liquidation Type Toggle */}
        <div className="mb-4 inline-flex">
          <SegmentedControl
            options={[
              { value: 1, label: 'Full Liquidation' },
              { value: 2, label: 'Partial Sale' },
            ]}
            value={liquidationType === 'full' ? 1 : 2}
            onChange={(value) => setLiquidationType(value === 1 ? 'full' : 'partial')}
            color="rose"
          />
        </div>

        {liquidationType === 'partial' && (
          <div className="mb-4">
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Sell Percentage: {sellPercentage}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={sellPercentage}
              onChange={(e) => setSellPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-blue-300 mt-1">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Shares to Sell</p>
            <p className="text-white text-lg font-bold">{sellShares.toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Current Market Price</p>
            <p className="text-white text-lg font-bold">
              ${(position.current_market_price || position.average_cost).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Target Sell Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={targetSellPrice}
              onChange={(e) => setTargetSellPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">
              Estimated Fees
            </label>
            <input
              type="number"
              step="0.01"
              value={fees}
              onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
          <p className="text-green-200 text-sm mb-1">Expected Net Proceeds</p>
          <p className="text-white text-3xl font-bold">${proceeds.toFixed(2)}</p>
          <p className="text-green-300 text-xs mt-1">
            {position.position_currency || 'USD'}
          </p>
        </div>

        {/* Next Action Selector */}
        <div className="mt-4">
          <label className="text-blue-200 text-sm mb-2 block font-medium">
            What would you like to do with the proceeds?
          </label>
          <SegmentedControl
            options={[
              { value: 1, label: 'Decide Later' },
              { value: 2, label: 'Reinvest' },
              { value: 3, label: 'Withdraw' },
            ]}
            value={nextAction === 'none' ? 1 : nextAction === 'reinvest' ? 2 : 3}
            onChange={(value) => setNextAction(value === 1 ? 'none' : value === 2 ? 'reinvest' : 'withdraw')}
            color="blue"
          />
        </div>
      </div>

      {/* Card 2: Reinvest */}
      <div className={`backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-400/20 transition-all ${
        nextAction !== 'reinvest' ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Step 2: Reinvest (Optional)</h3>
            <p className="text-blue-200 text-sm">Use proceeds to buy another ticker</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">New Ticker</label>
            <input
              type="text"
              value={reinvestTicker}
              onChange={(e) => setReinvestTicker(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white uppercase"
              placeholder="MSFT"
            />
          </div>
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Entry Price</label>
            <input
              type="number"
              step="0.01"
              value={reinvestPrice || ''}
              onChange={(e) => setReinvestPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-blue-200 text-sm mb-2 block font-medium">
            Reinvest Amount: ${reinvestAmount.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max={proceeds}
            step="100"
            value={reinvestAmount}
            onChange={(e) => setReinvestAmount(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-blue-300 mt-1">
            <span>$0</span>
            <span>${(proceeds / 2).toFixed(0)}</span>
            <span>${proceeds.toFixed(0)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Estimated Shares</p>
            <p className="text-white text-lg font-bold">{estimatedShares.toFixed(4)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Remaining Cash</p>
            <p className="text-white text-lg font-bold">${remainingCash.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Card 3: Withdraw */}
      <div className={`backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-6 border border-purple-400/20 transition-all ${
        nextAction !== 'withdraw' ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Step 3: Withdraw Cash</h3>
            <p className="text-blue-200 text-sm">Convert remaining proceeds to home currency</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-blue-200 text-sm mb-2 block font-medium">
            Withdraw to Currency
          </label>
          <select
            value={withdrawCurrency}
            onChange={(e) => setWithdrawCurrency(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          >
            <option value="USD" className="bg-slate-800">USD</option>
            <option value="AUD" className="bg-slate-800">AUD</option>
            <option value="EUR" className="bg-slate-800">EUR</option>
            <option value="GBP" className="bg-slate-800">GBP</option>
            <option value="JPY" className="bg-slate-800">JPY</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Remaining Cash</p>
            <p className="text-white text-lg font-bold">
              ${remainingCash.toFixed(2)} {position.position_currency}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Exchange Rate</p>
            <p className="text-white text-lg font-bold">
              {isLoadingConversion ? '...' : exchangeRate.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30">
          <p className="text-purple-200 text-sm mb-1">Converted Amount</p>
          <p className="text-white text-3xl font-bold">
            {isLoadingConversion ? 'Converting...' : `$${convertedAmount.toFixed(2)} ${withdrawCurrency}`}
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20">
        <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this scenario..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
        />
      </div>

      {/* View Scenario Modal */}
      {viewingScenario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Scenario Details
                </h2>
                <p className="text-blue-200 text-sm">
                  {position.ticker} - {viewingScenario.action_type === 'LIQUIDATE' ? 'Full Liquidation' : 'Partial Sale'}
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

            {/* Status Badges */}
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                viewingScenario.action_type === 'LIQUIDATE' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                {viewingScenario.action_type === 'LIQUIDATE' ? 'Full Liquidation' : 'Partial Sale'}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                viewingScenario.status === 'DRAFT' 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                  : viewingScenario.status === 'EXECUTED'
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
              }`}>
                {viewingScenario.status}
              </span>
            </div>

            {/* Liquidation Details */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/20 mb-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Liquidation Plan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {viewingScenario.action_type === 'PARTIAL_SELL' && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-blue-200 text-xs mb-1">Sell Percentage</p>
                    <p className="text-white font-bold">{viewingScenario.sell_percentage}%</p>
                  </div>
                )}
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-blue-200 text-xs mb-1">Shares to Sell</p>
                  <p className="text-white font-bold">{viewingScenario.sell_shares?.toFixed(4)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-blue-200 text-xs mb-1">Expected Proceeds</p>
                  <p className="text-white font-bold text-lg">${viewingScenario.expected_proceeds?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Reinvestment Details */}
            {viewingScenario.reinvest_ticker && (
              <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-400/20 mb-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Reinvestment Plan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-blue-200 text-xs mb-1">New Ticker</p>
                    <p className="text-white font-bold text-lg">{viewingScenario.reinvest_ticker}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-blue-200 text-xs mb-1">Reinvest Amount</p>
                    <p className="text-white font-bold">${viewingScenario.reinvest_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Details */}
            {viewingScenario.withdraw_currency && (
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-400/20 mb-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Withdrawal Plan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-blue-200 text-xs mb-1">Withdraw Amount</p>
                    <p className="text-white font-bold">${viewingScenario.withdraw_amount?.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-blue-200 text-xs mb-1">Withdraw Currency</p>
                    <p className="text-white font-bold text-lg">{viewingScenario.withdraw_currency}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {viewingScenario.notes && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
                <p className="text-blue-200 text-sm">{viewingScenario.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-300 text-xs mb-1">Created</p>
                  <p className="text-white">
                    {new Date(viewingScenario.created_at).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300 text-xs mb-1">Last Updated</p>
                  <p className="text-white">
                    {new Date(viewingScenario.updated_at).toLocaleString('en-US', { 
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

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <GlassButton
                icon={XCircle}
                onClick={() => setViewingScenario(null)}
                tooltip="Close"
                variant="secondary"
                size="lg"
              />
              <GlassButton
                icon={Save}
                onClick={() => {
                  setViewingScenario(null);
                  handleLoadScenario(viewingScenario);
                }}
                tooltip="Edit Scenario"
                variant="primary"
                size="lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}