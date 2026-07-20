'use client';

import { CashMovementWithDirection } from '../../lib/types/funding';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

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
      if (rate === 0) return amount.toFixed(4);
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
      onCancelEdit?.();
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
          headers: { 'Content-Type': 'application/json' },
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

    useImperativeHandle(ref, () => ({
      handleSubmit,
      handleCancel,
      canSubmit,
      isSubmitting,
    }));

    const labelCls = 'text-blue-200 text-sm font-medium';
    const inputCls = 'funding-input rounded-lg px-3 py-2 text-sm';
    const smallLabelCls = 'text-blue-300 text-[11px] mb-1 block';

    return (
      <div>
        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-md text-rose-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-4 items-center">
          {/* Transaction Type */}
          <label className={labelCls}>Type <span className="text-rose-400">*</span></label>
          <div className="w-fit">
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

          {/* Currencies + Amount */}
          <label className={`${labelCls} self-start pt-1`}>Currencies <span className="text-rose-400">*</span></label>
          <div className="flex gap-3 flex-wrap">
            <div>
              <span className={smallLabelCls}>Transaction</span>
              <select
                value={formData.homeCurrency}
                onChange={(e) => setFormData({ ...formData, homeCurrency: e.target.value })}
                className={`${inputCls} w-28`}
              >
                <option value="">Select</option>
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={smallLabelCls}>Exchange</span>
              <select
                value={formData.exchangeCurrency}
                onChange={(e) => setFormData({ ...formData, exchangeCurrency: e.target.value })}
                className={`${inputCls} w-28`}
              >
                <option value="">Select</option>
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={smallLabelCls}>Amount <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.01"
                value={formData.transactionAmount}
                onChange={(e) => setFormData({ ...formData, transactionAmount: e.target.value })}
                placeholder="1000.00"
                className={`${inputCls} w-32`}
              />
            </div>
          </div>

          {/* Rate + Value + Rate Type */}
          <label className={`${labelCls} self-start pt-1`}>Rate <span className="text-rose-400">*</span></label>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <span className={smallLabelCls}>Exchange rate <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.000001"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                placeholder="0.664000"
                className={`${inputCls} w-32`}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Exchange value</span>
              <input
                type="text"
                value={formData.transactionAmount && formData.exchangeRate ? calculateTrading() : ''}
                readOnly
                disabled
                placeholder="0.0000"
                className={`${inputCls} w-32 bg-white/5 cursor-not-allowed`}
              />
            </div>
            <div>
              <SegmentedPills
                options={[
                  { value: 1, label: 'Actual', icon: <CheckCircle className="w-4 h-4" />, activeColor: 'bg-pink-500' },
                  { value: 0, label: 'Earmarked', icon: <Clock className="w-4 h-4" />, activeColor: 'bg-cyan-500' },
                ]}
                value={formData.rateType}
                onChange={(value) => setFormData({ ...formData, rateType: value })}
                showLabels={true}
              />
            </div>
          </div>

          {/* Dates */}
          <label className={`${labelCls} self-start pt-1`}>Dates <span className="text-rose-400">*</span></label>
          <div className="flex gap-3 flex-wrap">
            <div>
              <span className={smallLabelCls}>Transaction <span className="text-rose-400">*</span></span>
              <input
                type="date"
                value={formData.txnDate}
                onChange={(e) => setFormData({ ...formData, txnDate: e.target.value })}
                className={`${inputCls} w-44`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Period from <span className="text-rose-400">*</span></span>
              <input
                type="date"
                value={formData.periodFrom}
                onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })}
                className={`${inputCls} w-44`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Period to <span className="text-rose-400">*</span></span>
              <input
                type="date"
                value={formData.periodTo}
                onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })}
                className={`${inputCls} w-44`}
              />
            </div>
          </div>

          {/* Notes */}
          <label className={`${labelCls} self-start pt-1`}>Notes</label>
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
);

DetailedEntryForm.displayName = 'DetailedEntryForm';