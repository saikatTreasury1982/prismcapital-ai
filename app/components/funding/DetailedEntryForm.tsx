'use client';

import { CashMovementWithDirection } from '../../lib/types/funding';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Plus, Save, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import { NotesPopoverInput } from '@/app/lib/ui/NotesPopoverInput';
import { CheckCircle, Clock } from 'lucide-react';

interface DetailedEntryFormProps {
  homeCurrency: string;
  tradingCurrency: string;
  onSuccess: () => void;
  onValidationChange?: (canSubmit: boolean) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  editingTransaction?: CashMovementWithDirection | null;
  onCancelEdit?: () => void;
}

export interface DetailedEntryFormRef {
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
}

export const DetailedEntryForm = forwardRef<DetailedEntryFormRef, DetailedEntryFormProps>(
  ({ homeCurrency, tradingCurrency, onSuccess, onValidationChange, onSubmittingChange, editingTransaction, onCancelEdit }, ref) => {
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [formData, setFormData] = useState({
      transactionAmount: '',
      homeCurrency: homeCurrency || '',
      exchangeCurrency: tradingCurrency || '',
      exchangeRate: '',
      rateType: 1, // 1 = Actual, 0 = Earmarked
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
            setFormData(prev => ({ ...prev, homeCurrency: result.data[0] }));
          }
        } catch (error) {
          console.error('Failed to fetch currencies:', error);
        }
      };

      fetchCurrencies();
    }, []);

    // Load editing transaction data
    useEffect(() => {
      if (editingTransaction) {
        setFormData({
          transactionAmount: editingTransaction.home_currency_value.toString(),
          homeCurrency: editingTransaction.home_currency_code,
          exchangeCurrency: editingTransaction.trading_currency_code,
          exchangeRate: editingTransaction.spot_rate.toString(),
          rateType: editingTransaction.spot_rate_isActual ?? 1,
          txnDate: editingTransaction.transaction_date,
          direction: editingTransaction.direction_id,
          periodFrom: editingTransaction.period_from || '',
          periodTo: editingTransaction.period_to || '',
          notes: editingTransaction.notes || '',
        });
      }
    }, [editingTransaction]);

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
        rateType: 1,
        txnDate: new Date().toISOString().split('T')[0],
        direction: 1,
        periodFrom: '',
        periodTo: '',
        notes: '',
      });
      setError(null);
      onCancelEdit?.(); // Clear editing state
    };

    const handleSubmit = async () => {
      setError(null);
      setIsSubmitting(true);
      onSubmittingChange?.(true);

      try {
        const isEditing = !!editingTransaction;
        const url = isEditing
          ? `/api/funding/movement/${editingTransaction.cash_movement_id}`
          : '/api/funding/movement';

        const response = await fetch(url, {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            home_currency_value: parseFloat(formData.transactionAmount),
            spot_rate: parseFloat(formData.exchangeRate),
            spot_rate_isActual: formData.rateType,
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
          rateType: 1,
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

        {/* Transaction Type and Notes Row */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="text-blue-200 text-sm mb-2 block">
              Transaction Type <span className="text-rose-400">*</span>
            </label>
            <SegmentedPills
              options={[
                { value: 1, label: 'Deposit', icon: <TrendingUp className="w-4 h-4" />, activeColor: 'bg-emerald-500' },
                { value: 2, label: 'Withdrawal', icon: <TrendingDown className="w-4 h-4" />, activeColor: 'bg-rose-500' },
              ]}
              value={formData.direction}
              onChange={(value) => setFormData({ ...formData, direction: value })}
              showLabels={true}
            />
          </div>

          {/* Notes Icon - No Label */}
          <div className="pt-8">
            <NotesPopoverInput
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
            />
          </div>
        </div>

        {/* Transaction Currency and Amount Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Transaction Currency <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.homeCurrency}
              onChange={(e) => setFormData({ ...formData, homeCurrency: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            >
              <option value="">Select currency</option>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Amount <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.transactionAmount}
              onChange={(e) => setFormData({ ...formData, transactionAmount: e.target.value })}
              placeholder="1000.00"
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>
        </div>

        {/* Exchange Currency and Auto-Calculated Value Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exchange Currency */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Exchange Currency <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.exchangeCurrency}
              onChange={(e) => setFormData({ ...formData, exchangeCurrency: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            >
              <option value="">Select currency</option>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Auto-Calculated Exchange Value */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Exchange Value (auto-calculated)
            </label>
            <input
              type="text"
              value={formData.transactionAmount && formData.exchangeRate ? calculateTrading() : ''}
              readOnly
              disabled
              placeholder="0.0000"
              className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white cursor-not-allowed"
            />
          </div>
        </div>

        {/* Exchange Rate and Rate Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
              placeholder="0.664000"
              className="w-full funding-input rounded-xl px-4 py-3"
              style={{
                appearance: 'textfield',
                MozAppearance: 'textfield',
                WebkitAppearance: 'none',
              }}
              onWheel={(e) => e.currentTarget.blur()}
            />
            <style jsx>{`
              input[type='number']::-webkit-outer-spin-button,
              input[type='number']::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
            `}</style>
          </div>

          {/* Rate Type */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Rate Type <span className="text-rose-400">*</span>
            </label>
            <SegmentedPills
              options={[
                { value: 1, label: 'Actual', icon: <CheckCircle className="w-4 h-4" />, activeColor: "bg-pink-500" },
                { value: 0, label: 'Earmarked', icon: <Clock className="w-4 h-4" />, activeColor: "bg-cyan-500" },
              ]}
              value={formData.rateType}
              onChange={(value) => setFormData({ ...formData, rateType: value })}
              showLabels={true}
            />
          </div>
        </div>

        {/* Date Fields - Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transaction Date */}
          <div>
            <label className="text-blue-200 text-sm mb-2 block">
              Transaction Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.txnDate}
              onChange={(e) => setFormData({ ...formData, txnDate: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })}
              className="w-full funding-input rounded-xl px-4 py-3"
            />
          </div>
        </div>
      </div>
    );
  }
);

DetailedEntryForm.displayName = 'DetailedEntryForm';