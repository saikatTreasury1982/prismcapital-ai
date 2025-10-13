'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { PositionForDividend } from '../../lib/types/dividend';
import { createDividend } from '../../services/dividendServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';

interface DividendEntryFormProps {
  positions: PositionForDividend[];
  onSuccess: () => void;
}

interface PositionCardProps {
  position: PositionForDividend;
  onAutoFill: (position: PositionForDividend) => void;
  isAutoFilling: boolean;
}

function PositionCard({ position, onAutoFill, isAutoFilling }: PositionCardProps) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-bold text-lg">{position.ticker}</h4>
        <button
          onClick={() => onAutoFill(position)}
          disabled={isAutoFilling}
          className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Auto-Fill"
        >
          <Sparkles className="w-4 h-4" />
        </button>
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

export function DividendEntryForm({ positions, onSuccess }: DividendEntryFormProps) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

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

  const handleAutoFill = async (position: PositionForDividend) => {
    setIsAutoFilling(true);
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
      // Check for duplicate dividend record
      const checkRes = await fetch(`/api/dividends-by-ticker?userId=${CURRENT_USER_ID}&ticker=${encodeURIComponent(formData.ticker)}`);
      const checkResult = await checkRes.json();
      
      if (checkResult.data && checkResult.data.length > 0) {
        const duplicate = checkResult.data.find((d: any) => d.ex_dividend_date === formData.ex_dividend_date);
        if (duplicate) {
          setError(`A dividend record for ${formData.ticker} with ex-dividend date ${formData.ex_dividend_date} already exists.`);
          setIsSubmitting(false);
          return;
        }
      }

      await createDividend(CURRENT_USER_ID, {
        ticker: formData.ticker.toUpperCase(),
        ex_dividend_date: formData.ex_dividend_date,
        payment_date: formData.payment_date || undefined,
        dividend_per_share: parseFloat(formData.dividend_per_share),
        shares_owned: parseFloat(formData.shares_owned),
        dividend_yield: formData.dividend_yield ? parseFloat(formData.dividend_yield) : undefined,
        Currency: formData.Currency || undefined,
        notes: formData.notes || undefined
      });

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
    <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
      {/* Left Column - Position Cards */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 h-fit">
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Form */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Plus className="w-6 h-6" />
          Quick Dividend Entry
        </h2>

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
              className="w-full funding-input rounded-xl px-4 py-3 uppercase"
              required
            />
          </div>

          {/* Shares Owned */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block font-medium">Shares Owned *</label>
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
            <label className="text-blue-200 text-sm mb-2 block font-medium">Ex-Dividend Date *</label>
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
            <label className="text-blue-200 text-sm mb-2 block font-medium">Dividend Per Share *</label>
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
            <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
              className="w-full funding-input rounded-xl px-4 py-3 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Dividend Entry'}
        </button>

        <div className="mt-3 text-center text-xs text-blue-300">
          * Required fields
        </div>
      </div>
    </div>
  );
}