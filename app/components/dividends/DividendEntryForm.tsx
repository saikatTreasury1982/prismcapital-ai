'use client';

import { useState, useEffect } from 'react';
import { PositionForDividend, Dividend } from '../../lib/types/dividend';
import { createDividend, updateDividend } from '../../services/dividendServiceClient';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Save, XCircle, Plus, Sparkles } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

interface DividendEntryFormProps {
  positions: PositionForDividend[];
  onSuccess: () => void;
  editingDividend?: Dividend | null;
  onCancelEdit?: () => void;
}

interface PositionCardProps {
  position: PositionForDividend;
  onAutoFill: (position: PositionForDividend) => void;
  isAutoFilling: boolean;
  loadingTicker: string | null;
}

function PositionCard({ position, onAutoFill, isAutoFilling, loadingTicker }: PositionCardProps) {
  const isThisCardLoading = loadingTicker === position.ticker;
  const isDisabled = isAutoFilling && !isThisCardLoading;

  return (
    <div
      onClick={() => !isAutoFilling && onAutoFill(position)}
      className={`p-3 bg-white/5 rounded-xl border border-white/10 transition-all relative ${isDisabled
          ? 'opacity-30 cursor-not-allowed'
          : 'cursor-pointer hover:scale-105 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20'
        } ${isThisCardLoading ? 'border-emerald-400 animate-pulse' : ''}`}
      title={isDisabled ? '' : 'Click to propose dividend for this position'}
      style={{ pointerEvents: isAutoFilling ? 'none' : 'auto' }}
    >
      {isThisCardLoading && (
        <div className="absolute inset-0 bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-emerald-300 text-xs font-semibold">Loading...</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-bold text-lg">{position.ticker}</h4>
      </div>

      {position.ticker_name && (
        <p className="text-blue-200 text-xs mb-2 line-clamp-1">{position.ticker_name}</p>
      )}

      <div className="space-y-1 text-xs">
        <p className="text-blue-300">
          {position.total_shares.toLocaleString()} shares
        </p>
        <p className="text-purple-300">
          Avg Cost: ${position.average_cost.toFixed(2)}
        </p>
        {position.current_market_price && (
          <p className="text-emerald-300">
            Market: ${position.current_market_price.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

export function DividendEntryForm({ positions, onSuccess, editingDividend, onCancelEdit }: DividendEntryFormProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    ex_dividend_date: '',
    payment_date: '',
    dividend_per_share: '',
    shares_owned: '',
    total_dividend_amount: '', // For display only
    dividend_yield: '',
    notes: '',
    Currency: 'USD'
  });

  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);

  // Auto-calculate total dividend amount
  useEffect(() => {
    const perShare = parseFloat(formData.dividend_per_share);
    const shares = parseFloat(formData.shares_owned);

    if (!isNaN(perShare) && !isNaN(shares)) {
      const total = perShare * shares;
      setFormData(prev => ({
        ...prev,
        total_dividend_amount: total.toFixed(2)
      }));
    }
  }, [formData.dividend_per_share, formData.shares_owned]);

  // Pre-fill form when editing - fetch full dividend record
  useEffect(() => {
    if (editingDividend) {
      const fetchFullDividendRecord = async () => {
        try {
          const response = await fetch(`/api/dividends?dividendId=${editingDividend.dividend_id}`);
          const result = await response.json();

          if (result.data) {
            const fullDividend = result.data;
            setFormData({
              ticker: fullDividend.ticker,
              ex_dividend_date: fullDividend.ex_dividend_date,
              payment_date: fullDividend.payment_date || '',
              dividend_per_share: fullDividend.dividend_per_share.toString(),
              shares_owned: fullDividend.shares_owned.toString(),
              total_dividend_amount: fullDividend.total_dividend_amount?.toString() || '',
              dividend_yield: fullDividend.dividend_yield?.toString() || '',
              notes: fullDividend.notes || '',
              Currency: fullDividend.Currency || 'USD'
            });
          }
        } catch (err) {
          console.error('Failed to fetch full dividend record:', err);
        }
      };

      fetchFullDividendRecord();
    }
  }, [editingDividend]);

  const handleAutoFill = async (position: PositionForDividend) => {
    setIsAutoFilling(true);
    setLoadingTicker(position.ticker);
    setError(null);

    try {
      // Step 1: Fetch data from AlphaVantage
      const alphaRes = await fetch(`/api/dividend-autofill?ticker=${encodeURIComponent(position.ticker)}`);
      const alphaResult = await alphaRes.json();

      if (alphaResult.error) {
        setError(alphaResult.error);
        setIsAutoFilling(false);
        return;
      }

      const { data: alphaData } = alphaResult;

      // Step 2: If we have an ex-dividend date, fetch exact amount from Yahoo Finance
      let dividendAmount = '';

      if (alphaData.exDividendDate) {
        try {
          const yahooRes = await fetch(
            `/api/yahoo-dividend?ticker=${encodeURIComponent(position.ticker)}&exDividendDate=${alphaData.exDividendDate}`
          );
          const yahooResult = await yahooRes.json();

          if (yahooResult.amount) {
            dividendAmount = yahooResult.amount.toString();
          } else {
            // Fallback: Use AlphaVantage annual dividend divided by 4 (assuming quarterly)
            if (alphaData.dividendPerShare) {
              const annual = parseFloat(alphaData.dividendPerShare);
              dividendAmount = (annual / 4).toFixed(4);
            }
          }
        } catch (yahooErr) {
          console.error('Yahoo Finance fetch failed, using AlphaVantage fallback:', yahooErr);
          // Fallback to AlphaVantage data
          if (alphaData.dividendPerShare) {
            const annual = parseFloat(alphaData.dividendPerShare);
            dividendAmount = (annual / 4).toFixed(4);
          }
        }
      }

      // Step 3: Populate the form
      setFormData(prev => ({
        ...prev,
        ticker: position.ticker,
        shares_owned: position.total_shares.toString(),
        dividend_per_share: dividendAmount || alphaData.dividendPerShare || '',
        dividend_yield: alphaData.dividendYield || '',
        ex_dividend_date: alphaData.exDividendDate || '',
        payment_date: alphaData.dividendDate || ''
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch dividend data');
    } finally {
      setIsAutoFilling(false);
      setLoadingTicker(null);
    }
  };

  const handleCancel = () => {
    setFormData({
      ticker: '',
      ex_dividend_date: '',
      payment_date: '',
      dividend_per_share: '',
      shares_owned: '',
      total_dividend_amount: '',
      dividend_yield: '',
      notes: '',
      Currency: 'USD'
    });
    setError(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = async () => {
    if (!formData.ticker || !formData.ex_dividend_date ||
      !formData.dividend_per_share || !formData.shares_owned) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate payment date is after ex-dividend date (if payment date is provided)
    if (formData.payment_date && formData.ex_dividend_date) {
      const exDate = new Date(formData.ex_dividend_date);
      const payDate = new Date(formData.payment_date);

      if (payDate <= exDate) {
        setError('Payment date must be later than ex-dividend date');
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingDividend) {
        // UPDATE MODE: Update existing dividend
        await updateDividend(editingDividend.dividend_id, {
          ticker: formData.ticker.toUpperCase(),
          ex_dividend_date: formData.ex_dividend_date,
          payment_date: formData.payment_date || undefined,
          dividend_per_share: parseFloat(formData.dividend_per_share),
          shares_owned: parseFloat(formData.shares_owned),
          total_dividend_amount: parseFloat(formData.total_dividend_amount),
          dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : undefined,
          Currency: formData.Currency || undefined,
          notes: formData.notes || undefined
        });
      } else {
        // CREATE MODE: Check for duplicates first
        const checkRes = await fetch(`/api/dividends-by-ticker?userId=${session?.user?.id}&ticker=${encodeURIComponent(formData.ticker)}`);
        const checkResult = await checkRes.json();

        if (checkResult.data && checkResult.data.length > 0) {
          const duplicate = checkResult.data.find((d: any) => d.ex_dividend_date === formData.ex_dividend_date);
          if (duplicate) {
            setError(`A dividend record for ${formData.ticker} with ex-dividend date ${formData.ex_dividend_date} already exists.`);
            setIsSubmitting(false);
            return;
          }
        }

        // Create new dividend
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }
        await createDividend(session.user.id, {
          ticker: formData.ticker.toUpperCase(),
          ex_dividend_date: formData.ex_dividend_date,
          payment_date: formData.payment_date || undefined,
          dividend_per_share: parseFloat(formData.dividend_per_share),
          shares_owned: parseFloat(formData.shares_owned),
          total_dividend_amount: parseFloat(formData.total_dividend_amount),
          dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : undefined,
          Currency: formData.Currency || undefined,
          notes: formData.notes || undefined
        });
      }

      // Reset form
      setFormData({
        ticker: '',
        ex_dividend_date: '',
        payment_date: '',
        dividend_per_share: '',
        shares_owned: '',
        total_dividend_amount: '',
        dividend_yield: '',
        notes: '',
        Currency: 'USD'
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create dividend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column - Position Cards */}
      <div className="lg:w-[420px] backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 h-fit">
        <h3 className="text-lg font-bold text-white mb-4">Open Positions</h3>

        {positions.length === 0 ? (
          <p className="text-blue-200 text-sm">No open positions found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {positions.map((position) => (
              <PositionCard
                key={position.position_id}
                position={position}
                onAutoFill={handleAutoFill}
                isAutoFilling={isAutoFilling}
                loadingTicker={loadingTicker}
              />
            ))}
          </div>
        )}
      </div>

      {/* GRADIENT DIVIDER */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-3" />

      {/* Right Column - Form */}
      <div className="flex-1 backdrop-blur-xl bg-white/10 rounded-3xl pt-6 px-6 pb-2 sm:pt-8 sm:px-8 sm:pb-8 border border-white/20 relative h-fit">
        {/* Loading Overlay */}
        {isAutoFilling && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-12 w-12 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-white text-lg font-semibold">Fetching dividend data...</span>
              {loadingTicker && (
                <span className="text-emerald-300 text-sm">for {loadingTicker}</span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Plus className="w-6 h-6" />
              {editingDividend ? 'Edit Dividend Entry' : 'Quick Dividend Entry'}
            </h2>
            <p className="text-xs text-blue-300 mt-1">* Required fields</p>
          </div>
          <div className="flex gap-2">
            <GlassButton
              icon={XCircle}
              onClick={handleCancel}
              tooltip="Clear Form"
              variant="secondary"
              size="md"
            />
            <GlassButton
              icon={Save}
              onClick={handleSubmit}
              disabled={isSubmitting}
              tooltip={editingDividend ? 'Update Dividend Entry' : 'Save Dividend Entry'}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ticker */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              placeholder="AAPL"
              className="w-full funding-input rounded-xl px-4 py-3 uppercase"
              required
            />
          </div>

          {/* Shares Owned */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Shares Owned <span className="text-rose-400">*</span></label>
            <input
              type="number"
              step="0.0001"
              value={formData.shares_owned}
              onChange={(e) => setFormData({ ...formData, shares_owned: e.target.value })}
              placeholder="100"
              className="w-full funding-input rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Ex-Dividend Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Ex-Dividend Date <span className="text-rose-400">*</span></label>
            <input
              type="date"
              value={formData.ex_dividend_date}
              onChange={(e) => setFormData({ ...formData, ex_dividend_date: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Payment Date</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Dividend Per Share */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Dividend Per Share <span className="text-rose-400">*</span></label>
            <input
              type="number"
              step="0.0001"
              value={formData.dividend_per_share}
              onChange={(e) => setFormData({ ...formData, dividend_per_share: e.target.value })}
              placeholder="0.25"
              className="w-full funding-input rounded-xl px-4 py-3"
              required
            />
          </div>

          {/* Total Dividend Amount (auto-calculated) */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Total Amount</label>
            <input
              type="text"
              value={formData.total_dividend_amount}
              readOnly
              className="w-full funding-input rounded-xl px-4 py-3 bg-white/5 cursor-not-allowed"
            />
          </div>

          {/* Dividend Yield */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Dividend Yield (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.dividend_yield}
              onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
              placeholder="2.5"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>

          {/* Year (auto-extracted) */}
          {/* Currency */}
          {/* Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Currency</label>
            <input
              type="text"
              value={formData.Currency || 'USD'}
              onChange={(e) => setFormData({ ...formData, Currency: e.target.value.toUpperCase() })}
              placeholder="USD"
              className="w-full funding-input rounded-xl px-4 py-3 uppercase"
              maxLength={3}
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
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
        </div>
      </div>
    </div>
  );
}