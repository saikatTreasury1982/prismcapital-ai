'use client';

import { useState, useEffect } from 'react';
import { PositionForDividend, Dividend } from '../../lib/types/dividend';
import { createDividend, updateDividend } from '../../services/dividendServiceClient';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Save, RefreshCw, Plus } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

interface DividendEntryFormProps {
  positions: PositionForDividend[];
  onSuccess: () => void;
  editingDividend?: Dividend | null;
  onCancelEdit?: () => void;
  selectedPosition?: PositionForDividend | null;
  onAutoFillingChange?: (isAutoFilling: boolean) => void;
  onLoadingTickerChange?: (ticker: string | null) => void;
}

export function DividendEntryForm({
  positions,
  onSuccess,
  editingDividend,
  onCancelEdit,
  selectedPosition,
  onAutoFillingChange,
  onLoadingTickerChange,
}: DividendEntryFormProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    position_id: '',
    ticker_name: '',
    ex_dividend_date: '',
    payment_date: '',
    dividend_per_share: '',
    shares_owned: '',
    total_dividend_amount: '',
    notes: '',
    Currency: 'USD',
  });

  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);

  // Report auto-fill state up to the wrapper (so it can dim tiles)
  useEffect(() => {
    onAutoFillingChange?.(isAutoFilling);
  }, [isAutoFilling, onAutoFillingChange]);

  useEffect(() => {
    onLoadingTickerChange?.(loadingTicker);
  }, [loadingTicker, onLoadingTickerChange]);

  // Auto-calculate total dividend amount
  useEffect(() => {
    const perShare = parseFloat(formData.dividend_per_share);
    const shares = parseFloat(formData.shares_owned);

    if (!isNaN(perShare) && !isNaN(shares)) {
      const total = perShare * shares;
      setFormData(prev => ({ ...prev, total_dividend_amount: total.toFixed(2) }));
    }
  }, [formData.dividend_per_share, formData.shares_owned]);

  // Pre-fill form when editing
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
              position_id: fullDividend.position_id?.toString() || '',
              ticker_name: fullDividend.ticker_name || '',
              ex_dividend_date: fullDividend.ex_dividend_date,
              payment_date: fullDividend.payment_date || '',
              dividend_per_share: fullDividend.dividend_per_share.toString(),
              shares_owned: fullDividend.shares_owned.toString(),
              total_dividend_amount: fullDividend.total_dividend_amount?.toString() || '',
              notes: fullDividend.notes || '',
              Currency: fullDividend.Currency || 'USD',
            });
          }
        } catch (err) {
          console.error('Failed to fetch full dividend record:', err);
        }
      };

      fetchFullDividendRecord();
    }
  }, [editingDividend]);

  // Auto-fill when a position is selected in the wrapper
  useEffect(() => {
    if (!selectedPosition) return;

    const runAutoFill = async () => {
      setIsAutoFilling(true);
      setLoadingTicker(selectedPosition.ticker);
      setError(null);

      try {
        const alphaRes = await fetch(`/api/dividend-autofill?ticker=${encodeURIComponent(selectedPosition.ticker)}`);
        const alphaResult = await alphaRes.json();

        if (alphaResult.error) {
          setError(alphaResult.error);
          return;
        }

        const { data: alphaData } = alphaResult;
        let dividendAmount = '';

        if (alphaData.exDividendDate) {
          try {
            const yahooRes = await fetch(
              `/api/yahoo-dividend?ticker=${encodeURIComponent(selectedPosition.ticker)}&exDividendDate=${alphaData.exDividendDate}`
            );
            const yahooResult = await yahooRes.json();

            if (yahooResult.amount) {
              dividendAmount = yahooResult.amount.toString();
            } else if (alphaData.dividendPerShare) {
              const annual = parseFloat(alphaData.dividendPerShare);
              dividendAmount = (annual / 4).toFixed(4);
            }
          } catch (yahooErr) {
            console.error('Yahoo fetch failed, using AlphaVantage fallback:', yahooErr);
            if (alphaData.dividendPerShare) {
              const annual = parseFloat(alphaData.dividendPerShare);
              dividendAmount = (annual / 4).toFixed(4);
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          ticker: selectedPosition.ticker,
          position_id: selectedPosition.position_id.toString(),
          ticker_name: selectedPosition.ticker_name || '',
          shares_owned: selectedPosition.total_shares.toString(),
          dividend_per_share: dividendAmount || alphaData.dividendPerShare || '',
          ex_dividend_date: alphaData.exDividendDate || '',
          payment_date: alphaData.dividendDate || '',
        }));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dividend data');
      } finally {
        setIsAutoFilling(false);
        setLoadingTicker(null);
      }
    };

    runAutoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPosition]);

  const resetForm = () => {
    setFormData({
      ticker: '',
      position_id: '',
      ticker_name: '',
      ex_dividend_date: '',
      payment_date: '',
      dividend_per_share: '',
      shares_owned: '',
      total_dividend_amount: '',
      notes: '',
      Currency: 'USD',
    });
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    if (onCancelEdit) onCancelEdit();
  };

  const handleSubmit = async () => {
    if (!formData.ticker || !formData.ex_dividend_date || !formData.dividend_per_share || !formData.shares_owned) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.position_id) {
      setError(`No open position found for ${formData.ticker}. Please select from Open Positions.`);
      return;
    }

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
        await updateDividend(editingDividend.dividend_id, {
          ticker: formData.ticker.toUpperCase(),
          position_id: parseInt(formData.position_id),
          ex_dividend_date: formData.ex_dividend_date,
          payment_date: formData.payment_date || undefined,
          dividend_per_share: parseFloat(formData.dividend_per_share),
          shares_owned: parseFloat(formData.shares_owned),
          total_dividend_amount: parseFloat(formData.total_dividend_amount),
          Currency: formData.Currency || undefined,
          notes: formData.notes || undefined,
        });
      } else {
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

        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }
        await createDividend(session.user.id, {
          ticker: formData.ticker.toUpperCase(),
          position_id: parseInt(formData.position_id),
          ex_dividend_date: formData.ex_dividend_date,
          payment_date: formData.payment_date || undefined,
          dividend_per_share: parseFloat(formData.dividend_per_share),
          shares_owned: parseFloat(formData.shares_owned),
          total_dividend_amount: parseFloat(formData.total_dividend_amount),
          Currency: formData.Currency || undefined,
          notes: formData.notes || undefined,
        });
      }

      resetForm();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create dividend');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls = 'text-blue-200 text-sm font-medium';
  const inputCls = 'funding-input rounded-lg px-3 py-2 text-sm w-full';
  const groupTagCls = 'text-blue-300 text-[11px] mb-1 block font-medium';
  const smallLabelCls = 'text-blue-300 text-[11px] mb-1 block';

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 sm:p-8 border border-white/20 relative">
      {/* Loading overlay over the whole form */}
      {isAutoFilling && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-12 w-12 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-white text-lg font-semibold">Fetching dividend data...</span>
            {loadingTicker && <span className="text-emerald-300 text-sm">for {loadingTicker}</span>}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingDividend ? 'Edit Dividend Entry' : 'Quick Dividend Entry'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">* Required fields · click a position to auto-fill</p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting}
            tooltip={editingDividend ? 'Update Dividend Entry' : 'Save Dividend Entry'}
            variant="primary"
            size="sm"
          />
          <GlassButton
            icon={RefreshCw}
            onClick={handleCancel}
            tooltip="Reset Form"
            variant="secondary"
            size="sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-md text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* ROW 1: Ticker + name + indicator */}
      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-center mb-5">
        <label className={labelCls}>Ticker <span className="text-rose-400">*</span></label>
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => {
              const upperTicker = e.target.value.toUpperCase();
              const matchingPosition = positions.find(p => p.ticker === upperTicker);
              setFormData({
                ...formData,
                ticker: upperTicker,
                ticker_name: matchingPosition?.ticker_name || '',
                position_id: matchingPosition ? matchingPosition.position_id.toString() : '',
              });
            }}
            placeholder="AAPL"
            className="funding-input rounded-lg px-3 py-2 text-sm w-28 flex-none uppercase"
          />
          <input
            type="text"
            value={formData.ticker_name}
            placeholder="Ticker name will appear here"
            className="funding-input rounded-lg px-3 py-2 text-sm flex-1 min-w-0 bg-white/5 cursor-not-allowed"
            disabled
          />
          {formData.position_id ? (
            <div className="relative group flex-none">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-600">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Open Position
              </div>
            </div>
          ) : formData.ticker ? (
            <div className="relative group flex-none">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-yellow-600">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                No Open Position
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ROW 2: Dates | Amounts with single divider */}
      <div
        className="grid gap-x-4 gap-y-5 items-start mb-5"
        style={{ gridTemplateColumns: '120px auto 1px minmax(0,1fr)' }}
      >
        {/* Dates (col 2, row 1) */}
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <span className={groupTagCls}>Dates <span className="text-rose-400">*</span></span>
          <div className="flex gap-3">
            <div>
              <span className={smallLabelCls}>Ex-dividend <span className="text-rose-400">*</span></span>
              <input
                type="date"
                value={formData.ex_dividend_date}
                onChange={(e) => setFormData({ ...formData, ex_dividend_date: e.target.value })}
                className={`${inputCls} w-40`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Payment</span>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className={`${inputCls} w-40`}
              />
            </div>
          </div>
        </div>

        {/* Divider (col 3, row 1) */}
        <div
          className="bg-gradient-to-b from-transparent via-white/20 to-transparent"
          style={{ gridColumn: 3, gridRow: 1, width: '1px' }}
        />

        {/* Amounts (col 4, row 1) */}
        <div style={{ gridColumn: 4, gridRow: 1 }}>
          <span className={groupTagCls}>Amounts <span className="text-rose-400">*</span></span>
          <div className="flex gap-2 flex-nowrap">
            <div>
              <span className={smallLabelCls}>Per share <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.0001"
                value={formData.dividend_per_share}
                onChange={(e) => setFormData({ ...formData, dividend_per_share: e.target.value })}
                placeholder="0.25"
                className={`${inputCls} w-[68px]`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Shares <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.0001"
                value={formData.shares_owned}
                onChange={(e) => setFormData({ ...formData, shares_owned: e.target.value })}
                placeholder="100"
                className={`${inputCls} w-[72px]`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Total</span>
              <input
                type="text"
                value={formData.total_dividend_amount}
                readOnly
                className={`${inputCls} w-[76px] bg-white/5 cursor-not-allowed`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Curr.</span>
              <input
                type="text"
                value={formData.Currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, Currency: e.target.value.toUpperCase() })}
                placeholder="USD"
                maxLength={3}
                className={`${inputCls} w-[56px] uppercase`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Notes */}
      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
        <label className={`${labelCls} pt-1`}>Notes</label>
        <BulletTextarea
          value={formData.notes}
          onChange={(value) => setFormData({ ...formData, notes: value })}
          placeholder="Add any additional notes (each line becomes a bullet point)..."
          rows={3}
          label=""
          rounded={false}
          scrollable={true}
        />
      </div>
    </div>
  );
}