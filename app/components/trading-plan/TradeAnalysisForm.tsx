'use client';

import { useState, useEffect } from 'react';
import { TradeAnalysis } from '@/app/lib/types/tradeAnalysis';
import { createTradeAnalysis, updateTradeAnalysis } from '@/app/services/tradeAnalysisServiceClient';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Save, XCircle, RotateCcw } from 'lucide-react';

interface TradeAnalysisFormProps {
  editingAnalysis?: TradeAnalysis | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TradeAnalysisForm({ editingAnalysis, onSuccess, onCancel }: TradeAnalysisFormProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    exchange_code: '',
    entry_price: '',
    position_size: '',
    stop_loss: '',
    take_profit: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Array<{ exchange_code: string; exchange_name: string }>>([]);
  const [isLoadingExchanges, setIsLoadingExchanges] = useState(true);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingAnalysis && exchanges.length > 0) {
      setFormData({
        ticker: editingAnalysis.ticker,
        exchange_code: editingAnalysis.exchange_code || '',
        entry_price: editingAnalysis.entry_price.toString(),
        position_size: editingAnalysis.position_size.toString(),
        stop_loss: editingAnalysis.stop_loss?.toString() || '',
        take_profit: editingAnalysis.take_profit?.toString() || '',
        notes: editingAnalysis.notes || '',
      });
    }
  }, [editingAnalysis, exchanges]);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await fetch('/api/exchanges');
        const result = await response.json();
        setExchanges(result.data || []);
      } catch (err) {
        console.error('Failed to fetch exchanges:', err);
      }
    };
    fetchExchanges();
  }, []);

  // Calculate metrics progressively
  const calculateMetrics = () => {
    const entry = parseFloat(formData.entry_price);
    const stopLoss = formData.stop_loss ? parseFloat(formData.stop_loss) : null;
    const takeProfit = formData.take_profit ? parseFloat(formData.take_profit) : null;
    const positionSize = parseFloat(formData.position_size);

    const metrics: any = {
      sharesToBuy: null,
      riskAmount: null,
      riskPercentage: null,
      rewardAmount: null,
      rewardPercentage: null,
      riskRewardRatio: null,
    };

    // Calculate shares if entry and position size available
    if (!isNaN(entry) && !isNaN(positionSize) && entry > 0) {
      metrics.sharesToBuy = (positionSize / entry).toFixed(2);
    }

    // Calculate risk if entry, position size, and stop loss available
    if (!isNaN(entry) && !isNaN(positionSize) && stopLoss !== null && !isNaN(stopLoss) && entry > 0) {
      const shares = positionSize / entry;
      metrics.riskAmount = ((entry - stopLoss) * shares).toFixed(2);
      metrics.riskPercentage = (((entry - stopLoss) / entry) * 100).toFixed(2);
    }

    // Calculate reward if entry, position size, and take profit available
    if (!isNaN(entry) && !isNaN(positionSize) && takeProfit !== null && !isNaN(takeProfit) && entry > 0) {
      const shares = positionSize / entry;
      metrics.rewardAmount = ((takeProfit - entry) * shares).toFixed(2);
      metrics.rewardPercentage = (((takeProfit - entry) / entry) * 100).toFixed(2);
    }

    // Calculate R:R ratio if both risk and reward percentages available
    if (metrics.riskPercentage && metrics.rewardPercentage && parseFloat(metrics.riskPercentage) !== 0) {
      metrics.riskRewardRatio = (parseFloat(metrics.rewardPercentage) / parseFloat(metrics.riskPercentage)).toFixed(2);
    }

    return metrics;
  };

  const metrics = calculateMetrics();

  const handleSubmit = async () => {
    // Validation - only ticker, entry_price, and position_size are required
    if (!formData.ticker || !formData.entry_price || !formData.position_size) {
      setError('Ticker, Entry Price, and Position Size are required');
      return;
    }

    const entry = parseFloat(formData.entry_price);
    const stopLoss = formData.stop_loss ? parseFloat(formData.stop_loss) : null;
    const takeProfit = formData.take_profit ? parseFloat(formData.take_profit) : null;

    // Validate stop loss if provided
    if (stopLoss !== null && stopLoss >= entry) {
      setError('Stop loss must be below entry price');
      return;
    }

    // Validate take profit if provided
    if (takeProfit !== null && takeProfit <= entry) {
      setError('Take profit must be above entry price');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingAnalysis) {
        // Update existing
        await updateTradeAnalysis(editingAnalysis.analysis_id, {
          exchange_code: formData.exchange_code === '' ? null : formData.exchange_code,
          entry_price: parseFloat(formData.entry_price),
          position_size: parseFloat(formData.position_size),
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : undefined,
          take_profit: formData.take_profit ? parseFloat(formData.take_profit) : undefined,
          notes: formData.notes || undefined,
        });
      } else {
        // Create new
        await createTradeAnalysis({
          ticker: formData.ticker.toUpperCase(),
          exchange_code: formData.exchange_code,
          entry_price: parseFloat(formData.entry_price),
          position_size: parseFloat(formData.position_size),
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : undefined,
          take_profit: formData.take_profit ? parseFloat(formData.take_profit) : undefined,
          notes: formData.notes || undefined,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      ticker: '',
      exchange_code: '',
      entry_price: '',
      position_size: '',
      stop_loss: '',
      take_profit: '',
      notes: '',
    });
    setError(null);
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {editingAnalysis ? 'Edit Trade Analysis' : 'New Trade Analysis'}
        </h2>
        <div className="flex gap-2">
          <GlassButton
            icon={RotateCcw}
            onClick={handleClear}
            disabled={isSubmitting}
            tooltip="Clear Form"
            variant="secondary"
            size="md"
          />
          <GlassButton
            icon={XCircle}
            onClick={onCancel}
            disabled={isSubmitting}
            tooltip="Cancel"
            variant="secondary"
            size="md"
          />
          <GlassButton
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting}
            tooltip={isSubmitting ? 'Saving...' : (editingAnalysis ? 'Update Analysis' : 'Create Analysis')}
            variant="primary"
            size="md"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ticker */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker *</label>
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 uppercase"
            disabled={!!editingAnalysis}
            required
          />
        </div>

        {/* Exchange */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Exchange</label>
          <select
            value={formData.exchange_code || ''}
            onChange={(e) => setFormData({ ...formData, exchange_code: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          >
            <option value="">-- Select an exchange --</option>
            {exchanges.length > 0 ? (
              exchanges.map((exchange) => (
                <option key={exchange.exchange_code} value={exchange.exchange_code} className="bg-slate-800 text-white">
                  {exchange.exchange_code} - {exchange.exchange_name}
                </option>
              ))
            ) : (
              <option disabled>Loading exchanges...</option>
            )}
          </select>
        </div>

        {/* Entry Price */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Entry Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.entry_price}
            onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
            placeholder="150.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            required
          />
        </div>

        {/* Position Size */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Position Size ($) *</label>
          <input
            type="number"
            step="100"
            value={formData.position_size}
            onChange={(e) => setFormData({ ...formData, position_size: e.target.value })}
            placeholder="10000"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            required
          />
        </div>

        {/* Stop Loss */}
        <div>
          <label className="text-rose-200 text-sm mb-2 block font-medium">Stop Loss</label>
          <input
            type="number"
            step="0.01"
            value={formData.stop_loss}
            onChange={(e) => setFormData({ ...formData, stop_loss: e.target.value })}
            placeholder="145.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          />
        </div>

        {/* Take Profit */}
        <div>
          <label className="text-green-200 text-sm mb-2 block font-medium">Take Profit</label>
          <input
            type="number"
            step="0.01"
            value={formData.take_profit}
            onChange={(e) => setFormData({ ...formData, take_profit: e.target.value })}
            placeholder="165.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Analysis notes..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
          />
        </div>
      </div>

      {/* Real-time Metrics Preview - Always Visible */}
      <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="text-white font-semibold mb-3">Calculated Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shares to Buy */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-blue-200 text-xs mb-1">Shares to Buy</p>
            <p className="text-white font-bold text-lg">
              {metrics.sharesToBuy || '-'}
            </p>
          </div>

          {/* Risk */}
          <div className="bg-white/5 rounded-xl p-3 border border-rose-400/20">
            <p className="text-rose-200 text-xs mb-1">Risk Amount / Risk %</p>
            <p className="text-rose-400 font-bold text-lg">
              {metrics.riskAmount ? `$${metrics.riskAmount}` : '-'} 
              {metrics.riskPercentage && <span className="text-sm ml-1">({metrics.riskPercentage}%)</span>}
            </p>
          </div>

          {/* Reward */}
          <div className="bg-white/5 rounded-xl p-3 border border-green-400/20">
            <p className="text-green-200 text-xs mb-1">Reward Amount / Reward %</p>
            <p className="text-green-400 font-bold text-lg">
              {metrics.rewardAmount ? `$${metrics.rewardAmount}` : '-'} 
              {metrics.rewardPercentage && <span className="text-sm ml-1">({metrics.rewardPercentage}%)</span>}
            </p>
          </div>

          {/* R:R Ratio */}
          <div className="bg-white/5 rounded-xl p-3 border border-blue-400/20">
            <p className="text-blue-200 text-xs mb-1">Risk:Reward Ratio</p>
            <p className="text-white font-bold text-lg">
              {metrics.riskRewardRatio ? `1:${metrics.riskRewardRatio}` : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-blue-300">
        * Required fields
      </div>
    </div>
  );
}