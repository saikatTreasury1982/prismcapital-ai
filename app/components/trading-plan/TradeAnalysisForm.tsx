'use client';

import { useState, useEffect } from 'react';
import { TradeAnalysis } from '@/app/lib/types/tradeAnalysis';
import { createTradeAnalysis, updateTradeAnalysis } from '@/app/services/tradeAnalysisServiceClient';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Save, XCircle, RotateCcw } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import { useDebounce } from '@/app/lib/hooks/useDebounce';
import { useSession } from 'next-auth/react';

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
    entry_type: 'STRICT',
    entry_low: '',
    entry_high: '',
    position_size: '',
    stop_loss: '',
    take_profit: '',
    notes: '',
  });

  const [tickerDescription, setTickerDescription] = useState<string>('');
  const { data: session } = useSession();
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);
  const debouncedTicker = useDebounce(formData.ticker, 500);
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
        entry_type: editingAnalysis.entry_type || 'STRICT',
        entry_low: editingAnalysis.entry_low?.toString() || '',
        entry_high: editingAnalysis.entry_high?.toString() || '',
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

  // Fetch ticker name when user stops typing
  useEffect(() => {
    const fetchTickerName = async () => {
      if (!debouncedTicker) {
        setTickerDescription('');
        return;
      }

      setIsLoadingTicker(true);

      try {
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}&userId=${session?.user?.id}`);
        const posData = await posRes.json();

        if (posData.hasPosition && posData.tickerName) {
          setTickerDescription(posData.tickerName);
        } else {
          const tickerRes = await fetch(`/api/ticker-lookup?ticker=${encodeURIComponent(debouncedTicker)}`);
          const tickerData = await tickerRes.json();
          setTickerDescription(tickerData.name || '');
        }
      } catch (err) {
        console.error('Error fetching ticker name:', err);
        setTickerDescription('');
      } finally {
        setIsLoadingTicker(false);
      }
    };

    fetchTickerName();
  }, [debouncedTicker, session?.user?.id]);

  // Calculate all metrics at a single entry price
  const calcAt = (entry: number, stopLoss: number | null, takeProfit: number | null, positionSize: number) => {
    if (isNaN(entry) || isNaN(positionSize) || entry <= 0) return null;

    const shares = positionSize / entry;
    const result: any = {
      entry,
      shares: shares.toFixed(2),
      riskAmount: null,
      riskPercentage: null,
      rewardAmount: null,
      rewardPercentage: null,
      riskRewardRatio: null,
    };

    if (stopLoss !== null && !isNaN(stopLoss)) {
      result.riskAmount = ((entry - stopLoss) * shares).toFixed(2);
      result.riskPercentage = (((entry - stopLoss) / entry) * 100).toFixed(2);
    }
    if (takeProfit !== null && !isNaN(takeProfit)) {
      result.rewardAmount = ((takeProfit - entry) * shares).toFixed(2);
      result.rewardPercentage = (((takeProfit - entry) / entry) * 100).toFixed(2);
    }
    if (result.riskPercentage && result.rewardPercentage && parseFloat(result.riskPercentage) !== 0) {
      result.riskRewardRatio = (parseFloat(result.rewardPercentage) / parseFloat(result.riskPercentage)).toFixed(2);
    }

    return result;
  };

  const calculateMetrics = () => {
    const isRange = formData.entry_type === 'RANGE';
    const low = parseFloat(formData.entry_low);
    const high = parseFloat(formData.entry_high);
    const stopLoss = formData.stop_loss ? parseFloat(formData.stop_loss) : null;
    const takeProfit = formData.take_profit ? parseFloat(formData.take_profit) : null;
    const positionSize = parseFloat(formData.position_size);

    const mid = isRange
      ? (!isNaN(low) && !isNaN(high) ? (low + high) / 2 : NaN)
      : parseFloat(formData.entry_price);

    return {
      isRange,
      atLow: isRange ? calcAt(low, stopLoss, takeProfit, positionSize) : null,
      atMid: calcAt(mid, stopLoss, takeProfit, positionSize),
      atHigh: isRange ? calcAt(high, stopLoss, takeProfit, positionSize) : null,
    };
  };

  const rrColor = (ratio: string | null | undefined) => {
    if (!ratio) return 'text-white';
    const r = parseFloat(ratio);
    if (r >= 2) return 'text-green-400';
    if (r >= 1) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const metrics = calculateMetrics();

  const handleSubmit = async () => {
    // Validation - only ticker, entry_price, and position_size are required
    const isRange = formData.entry_type === 'RANGE';

    if (!formData.ticker || !formData.position_size) {
      setError('Ticker and Position Size are required');
      return;
    }
    if (isRange && (!formData.entry_low || !formData.entry_high)) {
      setError('Entry low and entry high are required');
      return;
    }
    if (!isRange && !formData.entry_price) {
      setError('Entry Price is required');
      return;
    }

    const low = parseFloat(formData.entry_low);
    const high = parseFloat(formData.entry_high);

    if (isRange && low >= high) {
      setError('Entry low must be below entry high');
      return;
    }

    const entry = isRange ? (low + high) / 2 : parseFloat(formData.entry_price);
    const compareLow = isRange ? low : entry;
    const compareHigh = isRange ? high : entry;

    const stopLoss = formData.stop_loss ? parseFloat(formData.stop_loss) : null;
    const takeProfit = formData.take_profit ? parseFloat(formData.take_profit) : null;

    if (stopLoss !== null && stopLoss >= compareLow) {
      setError('Stop loss must be below the entry range');
      return;
    }
    if (takeProfit !== null && takeProfit <= compareHigh) {
      setError('Take profit must be above the entry range');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingAnalysis) {
        // Update existing
        await updateTradeAnalysis(editingAnalysis.analysis_id, {
          exchange_code: formData.exchange_code === '' ? null : formData.exchange_code,
          entry_type: formData.entry_type as 'STRICT' | 'RANGE',
          entry_price: entry,
          entry_low: isRange ? low : undefined,
          entry_high: isRange ? high : undefined,
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
          entry_type: formData.entry_type as 'STRICT' | 'RANGE',
          entry_price: entry,
          entry_low: isRange ? low : undefined,
          entry_high: isRange ? high : undefined,
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
      entry_type: 'STRICT',
      entry_low: '',
      entry_high: '',
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
        <div>
          <h2 className="text-2xl font-bold text-white">
            {editingAnalysis ? 'Edit Trade Analysis' : 'New Trade Analysis'}
          </h2>
          <div className="mt-3 text-left text-xs text-blue-300">
            * Required fields
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ticker */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker <span className="text-rose-400">*</span></label>
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

          {/* Ticker Description + Entry Type */}
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-blue-200 text-xs mb-1">Company</p>
              <p className="text-white text-sm font-medium truncate">
                {isLoadingTicker
                  ? <span className="text-blue-300/50">Loading…</span>
                  : tickerDescription || <span className="text-blue-300/50">—</span>}
              </p>
            </div>
            <SegmentedPills<'STRICT' | 'RANGE'>
              options={[
                { value: 'STRICT', label: 'Strict price' },
                { value: 'RANGE', label: 'Price range' },
              ]}
              value={formData.entry_type as 'STRICT' | 'RANGE'}
              onChange={(v) => setFormData({ ...formData, entry_type: v })}
              activeColor="bg-blue-500"
            />
          </div>

          {/* Entry Price / Range */}
          {formData.entry_type === 'STRICT' ? (
            <div>
              <label className="text-blue-200 text-sm mb-2 block font-medium">Entry Price <span className="text-rose-400">*</span></label>
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Entry Low <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entry_low}
                  onChange={(e) => setFormData({ ...formData, entry_low: e.target.value })}
                  placeholder="148.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Entry High <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entry_high}
                  onChange={(e) => setFormData({ ...formData, entry_high: e.target.value })}
                  placeholder="152.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
            </div>
          )}

          {/* Position Size */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Position Size ($) <span className="text-rose-400">*</span></label>
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
        </div>
        {/* RIGHT COLUMN: Metrics */}
        <div className="lg:col-span-2 p-4 bg-white/5 rounded-2xl border border-white/10 self-start">
          <h3 className="text-white font-semibold mb-3">Calculated Metrics</h3>

          {metrics.isRange ? (
            <div className="grid grid-cols-[auto_1fr_1fr_1fr] text-xs">
              {/* Header row */}
              <div className="py-2 pr-2" />
              <div className="py-2 px-1 text-right border-b border-white/10">
                <p className="text-blue-300/60 text-[10px]">AT LOW</p>
                <p className="text-green-400 font-medium">{formData.entry_low ? `$${parseFloat(formData.entry_low).toFixed(2)}` : '-'}</p>
              </div>
              <div className="py-2 px-1 text-right border-b border-white/10 bg-white/5">
                <p className="text-blue-300/60 text-[10px]">MIDPOINT</p>
                <p className="text-white font-medium">{metrics.atMid ? `$${metrics.atMid.entry.toFixed(2)}` : '-'}</p>
              </div>
              <div className="py-2 pl-1 text-right border-b border-white/10">
                <p className="text-blue-300/60 text-[10px]">AT HIGH</p>
                <p className="text-rose-400 font-medium">{formData.entry_high ? `$${parseFloat(formData.entry_high).toFixed(2)}` : '-'}</p>
              </div>

              {/* Shares */}
              <div className="py-2 pr-2 text-blue-200">Shares</div>
              <div className="py-2 px-1 text-right text-white font-medium">{metrics.atLow?.shares || '-'}</div>
              <div className="py-2 px-1 text-right text-white font-medium bg-white/5">{metrics.atMid?.shares || '-'}</div>
              <div className="py-2 pl-1 text-right text-white font-medium">{metrics.atHigh?.shares || '-'}</div>

              {/* Risk */}
              <div className="py-2 pr-2 text-blue-200">Risk</div>
              <div className="py-2 px-1 text-right text-rose-400">
                {metrics.atLow?.riskAmount ? <>${metrics.atLow.riskAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atLow.riskPercentage}%</span></> : '-'}
              </div>
              <div className="py-2 px-1 text-right text-rose-400 bg-white/5">
                {metrics.atMid?.riskAmount ? <>${metrics.atMid.riskAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atMid.riskPercentage}%</span></> : '-'}
              </div>
              <div className="py-2 pl-1 text-right text-rose-400">
                {metrics.atHigh?.riskAmount ? <>${metrics.atHigh.riskAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atHigh.riskPercentage}%</span></> : '-'}
              </div>

              {/* Reward */}
              <div className="py-2 pr-2 text-blue-200">Reward</div>
              <div className="py-2 px-1 text-right text-green-400">
                {metrics.atLow?.rewardAmount ? <>${metrics.atLow.rewardAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atLow.rewardPercentage}%</span></> : '-'}
              </div>
              <div className="py-2 px-1 text-right text-green-400 bg-white/5">
                {metrics.atMid?.rewardAmount ? <>${metrics.atMid.rewardAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atMid.rewardPercentage}%</span></> : '-'}
              </div>
              <div className="py-2 pl-1 text-right text-green-400">
                {metrics.atHigh?.rewardAmount ? <>${metrics.atHigh.rewardAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atHigh.rewardPercentage}%</span></> : '-'}
              </div>

              {/* R:R */}
              <div className="pt-3 pr-2 text-blue-200 font-medium border-t border-white/10">R:R</div>
              <div className={`pt-3 px-1 text-right font-bold text-base border-t border-white/10 ${rrColor(metrics.atLow?.riskRewardRatio)}`}>
                {metrics.atLow?.riskRewardRatio ? `1:${metrics.atLow.riskRewardRatio}` : '-'}
              </div>
              <div className={`pt-3 px-1 text-right font-bold text-base border-t border-white/10 bg-white/5 ${rrColor(metrics.atMid?.riskRewardRatio)}`}>
                {metrics.atMid?.riskRewardRatio ? `1:${metrics.atMid.riskRewardRatio}` : '-'}
              </div>
              <div className={`pt-3 pl-1 text-right font-bold text-base border-t border-white/10 ${rrColor(metrics.atHigh?.riskRewardRatio)}`}>
                {metrics.atHigh?.riskRewardRatio ? `1:${metrics.atHigh.riskRewardRatio}` : '-'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr] text-xs">
              <div className="py-2 pr-2 text-blue-200">Shares</div>
              <div className="py-2 text-right text-white font-medium">{metrics.atMid?.shares || '-'}</div>

              <div className="py-2 pr-2 text-blue-200">Risk</div>
              <div className="py-2 text-right text-rose-400">
                {metrics.atMid?.riskAmount ? <>${metrics.atMid.riskAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atMid.riskPercentage}%</span></> : '-'}
              </div>

              <div className="py-2 pr-2 text-blue-200">Reward</div>
              <div className="py-2 text-right text-green-400">
                {metrics.atMid?.rewardAmount ? <>${metrics.atMid.rewardAmount} <span className="text-blue-300/60 text-[11px]">{metrics.atMid.rewardPercentage}%</span></> : '-'}
              </div>

              <div className="pt-3 pr-2 text-blue-200 font-medium border-t border-white/10">R:R</div>
              <div className={`pt-3 text-right font-bold text-base border-t border-white/10 ${rrColor(metrics.atMid?.riskRewardRatio)}`}>
                {metrics.atMid?.riskRewardRatio ? `1:${metrics.atMid.riskRewardRatio}` : '-'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <BulletTextarea
          value={formData.notes}
          onChange={(value) => setFormData({ ...formData, notes: value })}
          placeholder="Add any additional notes (each line becomes a bullet point)..."
          rows={4}
          label="Notes (Optional)"
          rounded={false}
          scrollable={true}
        />
      </div>
    </div >
  );
}
