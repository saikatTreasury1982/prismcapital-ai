'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DetailedEntryFormProps {
  homeCurrency: string;
  tradingCurrency: string;
  onSuccess: () => void;
}

export function DetailedEntryForm({ homeCurrency, tradingCurrency, onSuccess }: DetailedEntryFormProps) {
  const [formData, setFormData] = useState({
    homeValue: '',
    spotRate: '',
    txnDate: new Date().toISOString().split('T')[0],
    direction: 1,
    periodFrom: '',
    periodTo: '',
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTrading = () => {
    const home = parseFloat(formData.homeValue) || 0;
    const rate = parseFloat(formData.spotRate) || 0;
    return (home * rate).toFixed(4);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Call API route instead of service directly
      const response = await fetch('/api/funding/movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_currency_value: parseFloat(formData.homeValue),
          spot_rate: parseFloat(formData.spotRate),
          transaction_date: formData.txnDate,
          direction_id: formData.direction,
          period_from: formData.periodFrom,
          period_to: formData.periodTo,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      // Reset form
      setFormData({
        homeValue: '',
        spotRate: '',
        txnDate: new Date().toISOString().split('T')[0],
        direction: 1,
        periodFrom: '',
        periodTo: '',
        notes: '',
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl p-6 border border-blue-400/30">
      <h3 className="text-white font-semibold mb-4">Complete Transaction Details</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-15">
        {/* Direction */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block">
            Transaction Type <span className="text-rose-400">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({...formData, direction: 1})}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                formData.direction === 1
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-white/10 text-emerald-200 border border-white/20'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, direction: 2})}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                formData.direction === 2
                  ? 'bg-rose-500 text-white shadow-lg'
                  : 'bg-white/10 text-rose-200 border border-white/20'
              }`}
            >
              <TrendingDown className="w-5 h-5 inline mr-2" />
              Withdrawal
            </button>
          </div>
        </div>

        {/* Amount and Spot Rate Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              {homeCurrency} Amount <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.homeValue}
              onChange={(e) => setFormData({...formData, homeValue: e.target.value})}
              placeholder="1000.00"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>

          {/* Spot Rate */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Spot Rate <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              required
              value={formData.spotRate}
              onChange={(e) => setFormData({...formData, spotRate: e.target.value})}
              placeholder="0.664000"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>
        </div>

        {/* Calculated Trading Currency */}
        {formData.homeValue && formData.spotRate && (
          <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
            <div className="text-blue-300 text-sm mb-1">{tradingCurrency} Value (auto-calculated)</div>
            <div className="text-2xl font-bold text-white">{calculateTrading()}</div>
          </div>
        )}

        {/* Dates and Notes - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Date Fields */}
          <div className="space-y-4">
            {/* Transaction Date */}
            <div>
              <label className="text-blue-200 text-sm mb-2 block">
                Transaction Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.txnDate}
                onChange={(e) => setFormData({...formData, txnDate: e.target.value})}
                className="w-full funding-input rounded-xl px-4 py-3"
              />
            </div>

            {/* Period From */}
            <div>
              <label className="text-blue-200 text-sm mb-2 block">
                Period From <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.periodFrom}
                onChange={(e) => setFormData({...formData, periodFrom: e.target.value})}
                className="w-full funding-input rounded-xl px-4 py-3"
              />
            </div>

            {/* Period To */}
            <div>
              <label className="text-blue-200 text-sm mb-2 block">
                Period To <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.periodTo}
                onChange={(e) => setFormData({...formData, periodTo: e.target.value})}
                className="w-full funding-input rounded-xl px-4 py-3"
              />
            </div>
          </div>

          {/* Right Column - Notes (Full Height) */}
          <div className="flex flex-col">
            <label className="text-blue-200 text-sm mb-2 block">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any additional notes..."
              className="w-full funding-input rounded-xl px-4 py-3 resize-none flex-1"
              style={{ minHeight: '100%' }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !formData.homeValue || !formData.spotRate || !formData.txnDate || !formData.periodFrom || !formData.periodTo}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save Transaction'}
      </button>
    </div>
  );
}