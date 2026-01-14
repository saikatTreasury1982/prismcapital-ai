'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Plus, Save, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

interface DetailedEntryFormProps {
  homeCurrency: string;
  tradingCurrency: string;
  onSuccess: () => void;
  onValidationChange?: (canSubmit: boolean) => void;  // ADD THIS
  onSubmittingChange?: (isSubmitting: boolean) => void;  // ADD THIS
}

export interface DetailedEntryFormRef {
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
}

export const DetailedEntryForm = forwardRef<DetailedEntryFormRef, DetailedEntryFormProps>(
  ({ homeCurrency, tradingCurrency, onSuccess, onValidationChange, onSubmittingChange }, ref) => {
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [formData, setFormData] = useState({
      transactionAmount: '',
      homeCurrency: homeCurrency || '',
      exchangeCurrency: tradingCurrency || '',
      exchangeRate: '',
      txnDate: new Date().toISOString().split('T')[0],
      direction: 1,
      periodFrom: '',
      periodTo: '',
      notes: '',
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchCurrencies = async () => {
        try {
          const response = await fetch('/api/currencies');
          const result = await response.json();
          setCurrencies(result.data || []);
          
          if (result.data && result.data.length > 0 && !formData.homeCurrency) {
            setFormData(prev => ({...prev, homeCurrency: result.data[0]}));
          }
        } catch (error) {
          console.error('Failed to fetch currencies:', error);
        }
      };
      
      fetchCurrencies();
    }, []);

    const calculateTrading = () => {
      const amount = parseFloat(formData.transactionAmount) || 0;
      const rate = parseFloat(formData.exchangeRate) || 0;
      
      if (rate === 0) {
        return amount.toFixed(4);
      }
      
      return (amount * rate).toFixed(4);
    };

    const handleCancel = () => {
      setFormData({
        transactionAmount: '',
        homeCurrency: formData.homeCurrency,
        exchangeCurrency: formData.exchangeCurrency,
        exchangeRate: '',
        txnDate: new Date().toISOString().split('T')[0],
        direction: 1,
        periodFrom: '',
        periodTo: '',
        notes: '',
      });
      setError(null);
    };

    const handleSubmit = async () => {
      setError(null);
      setIsSubmitting(true);
      onSubmittingChange?.(true);

      try {
        const response = await fetch('/api/funding/movement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            home_currency_value: parseFloat(formData.transactionAmount),
            spot_rate: parseFloat(formData.exchangeRate),
            transaction_date: formData.txnDate,
            direction_id: formData.direction,
            period_from: formData.periodFrom,
            period_to: formData.periodTo,
            notes: formData.notes || undefined,
            home_currency_code: formData.homeCurrency,
            trading_currency_code: formData.exchangeCurrency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create transaction');
        }

        // Reset form
        setFormData({
          transactionAmount: '',
          homeCurrency: formData.homeCurrency,
          exchangeCurrency: formData.exchangeCurrency,
          exchangeRate: '',
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
        onSubmittingChange?.(false);
      }
    };

    const canSubmit = !!(
      formData.transactionAmount && 
      formData.exchangeRate && 
      formData.txnDate && 
      formData.periodFrom && 
      formData.periodTo && 
      formData.homeCurrency && 
      formData.exchangeCurrency
    );
    
    useEffect(() => {
      onValidationChange?.(canSubmit);
    }, [canSubmit, onValidationChange]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      handleSubmit,
      handleCancel,
      canSubmit,
      isSubmitting,
    }));

    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
            {error}
          </div>
        )}

        {/* Direction */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block">
            Transaction Type <span className="text-rose-400">*</span>
          </label>
          <SegmentedControl
            options={[
              { value: 1, label: 'Deposit', icon: <TrendingUp className="w-5 h-5" /> },
              { value: 2, label: 'Withdrawal', icon: <TrendingDown className="w-5 h-5" /> },
            ]}
            value={formData.direction}
            onChange={(value) => setFormData({...formData, direction: value})}
            className="w-full"
          />
        </div>

        {/* Transaction Amount and Home Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Transaction Currency <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.homeCurrency}
              onChange={(e) => setFormData({...formData, homeCurrency: e.target.value})}
              className="w-full funding-input rounded-xl px-4 py-3"
            >
              <option value="">Select currency</option>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Transaction Amount */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Amount <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.transactionAmount}
              onChange={(e) => setFormData({...formData, transactionAmount: e.target.value})}
              placeholder="1000.00"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>
        </div>

        {/* Exchange Currency and Exchange Rate Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exchange Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Exchange Currency <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.exchangeCurrency}
              onChange={(e) => setFormData({...formData, exchangeCurrency: e.target.value})}
              className="w-full funding-input rounded-xl px-4 py-3"
            >
              <option value="">Select currency</option>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Exchange Rate <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.000001"
              required
              value={formData.exchangeRate}
              onChange={(e) => setFormData({...formData, exchangeRate: e.target.value})}
              placeholder="0.664000"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>
        </div>

        {/* Calculated Exchange Currency Value */}
        {formData.transactionAmount && formData.exchangeRate && (
          <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
            <div className="text-blue-300 text-sm mb-1">Exchange Value (auto-calculated)</div>
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
            <BulletTextarea
              value={formData.notes}
              onChange={(value) => setFormData({...formData, notes: value})}
              placeholder="Add any additional notes (each line becomes a bullet point)..."
              rows={8}
              label="Notes (Optional)"
            />
          </div>
        </div>
      </div>
    );
  }
);

DetailedEntryForm.displayName = 'DetailedEntryForm';