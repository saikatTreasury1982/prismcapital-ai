'use client';

import { useState, useEffect } from 'react';
import { Transaction, Position } from '../../lib/types/transaction';
import { createTransaction, updateTransaction } from '../../services/transactionServiceClient';
import { useDebounce } from '../../lib/hooks/useDebounce';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import { Plus, Save, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import { StagingRecord } from '@/app/lib/types/moomoo';

interface TransactionEntryFormProps {
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  mode?: 'create' | 'edit' | 'staging';
  stagingRecord?: StagingRecord;
  selectedPosition?: Position | null;
  onClearSelection?: () => void;
}

interface Strategy {
  strategy_code: string;
  strategy_name: string;
  description: string;
}

export function TransactionEntryForm({
  onSuccess,
  editingTransaction,
  onCancelEdit,
  mode = 'create',
  stagingRecord,
  selectedPosition,
  onClearSelection,
}: TransactionEntryFormProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [formData, setFormData] = useState({
    ticker: '',
    transaction_type_id: 1,
    strategy_code: 'LONG_TERM',
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    fees: '0',
    transaction_currency: 'USD',
    notes: '',
    trade_value: '0',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPosition, setHasPosition] = useState<boolean | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [positionStrategy, setPositionStrategy] = useState<string | null>(null);

  const debouncedTicker = useDebounce(formData.ticker, 500);

  const isPositionLocked = !!selectedPosition;

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch('/api/strategies');
        const result = await response.json();
        setStrategies(result.data);
      } catch (err) {
        console.error('Failed to fetch strategies:', err);
      }
    };
    fetchStrategies();
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      setFormData(prev => ({
        ...prev,
        ticker: selectedPosition.ticker,
        strategy_code: selectedPosition.strategy || prev.strategy_code,
        transaction_currency: selectedPosition.position_currency || prev.transaction_currency,
      }));
      if (selectedPosition.ticker_name) {
        setCompanyName(selectedPosition.ticker_name);
      }
    }
  }, [selectedPosition]);

  useEffect(() => {
    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);

    if (!isNaN(quantity) && !isNaN(price)) {
      const tradeValue = quantity * price;
      setFormData(prev => ({ ...prev, trade_value: tradeValue.toFixed(2) }));
    }
  }, [formData.quantity, formData.price]);

  useEffect(() => {
    const fetchTickerData = async () => {
      if (!debouncedTicker) {
        setHasPosition(null);
        setTickerError(null);
        setCompanyName('');
        setPositionStrategy(null);
        return;
      }

      if (strategies.length === 0) return;

      setIsLoadingTicker(true);
      setTickerError(null);

      try {
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}`);
        const posData = await posRes.json();

        setHasPosition(posData.hasPosition);

        if (posData.hasPosition) {
          const positionRes = await fetch(`/api/positions/${encodeURIComponent(debouncedTicker)}`);
          if (positionRes.ok) {
            const positionData = await positionRes.json();
            if (positionData.data && positionData.data.strategy) {
              const strategy = strategies.find(s => s.strategy_code === positionData.data.strategy);
              setPositionStrategy(strategy ? strategy.strategy_name : null);
            } else {
              setPositionStrategy(null);
            }
          } else {
            setPositionStrategy(null);
          }
        } else {
          setPositionStrategy(null);
        }

        if (posData.hasPosition && posData.tickerName) {
          setCompanyName(posData.tickerName);
          setTickerError(null);
        } else {
          const tickerRes = await fetch(`/api/ticker-lookup?ticker=${encodeURIComponent(debouncedTicker)}`);
          const tickerData = await tickerRes.json();
          if (tickerData.error) {
            setTickerError(tickerData.error);
            setCompanyName('');
          } else if (tickerData.name) {
            setCompanyName(tickerData.name);
            setTickerError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching ticker data:', err);
        setTickerError('Failed to lookup ticker');
        setCompanyName('');
        setHasPosition(null);
        setPositionStrategy(null);
      } finally {
        setIsLoadingTicker(false);
      }
    };

    fetchTickerData();
  }, [debouncedTicker, strategies]);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ticker: editingTransaction.ticker,
        transaction_type_id: editingTransaction.transaction_type_id,
        strategy_code: 'LONG_TERM',
        transaction_date: editingTransaction.transaction_date,
        quantity: editingTransaction.quantity.toString(),
        price: editingTransaction.price.toString(),
        fees: editingTransaction.fees.toString(),
        transaction_currency: editingTransaction.transaction_currency,
        notes: editingTransaction.notes || '',
        trade_value: editingTransaction.trade_value.toString(),
      });
    } else if (mode === 'staging' && stagingRecord) {
      setFormData({
        ticker: stagingRecord.ticker || '',
        transaction_type_id: stagingRecord.transaction_type_id || 1,
        strategy_code: stagingRecord.strategy_code || '',
        transaction_date: stagingRecord.transaction_date || '',
        quantity: stagingRecord.quantity?.toString() || '',
        price: stagingRecord.price?.toString() || '',
        fees: stagingRecord.fees?.toString() || '0',
        transaction_currency: stagingRecord.transaction_currency || 'USD',
        notes: stagingRecord.notes || '',
        trade_value: stagingRecord.trade_value?.toString() || '0',
      });
      if (stagingRecord.ticker_name) {
        setCompanyName(stagingRecord.ticker_name);
      }
    }
  }, [editingTransaction, mode, stagingRecord]);

  const resetForm = () => {
    setFormData({
      ticker: '',
      transaction_type_id: 1,
      strategy_code: 'LONG_TERM',
      transaction_date: new Date().toISOString().split('T')[0],
      quantity: '',
      price: '',
      fees: '0',
      transaction_currency: 'USD',
      notes: '',
      trade_value: '0',
    });
    setCompanyName('');
    setHasPosition(null);
    setError(null);
    setTickerError(null);
    setPositionStrategy(null);
  };

  const handleSubmit = async () => {
    if (!formData.ticker || !formData.transaction_date || !formData.quantity || !formData.price) {
      setError('Ticker, Date, Quantity, and Price are required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.transaction_id, {
          fees: parseFloat(formData.fees),
          notes: formData.notes || undefined,
        });
      } else {
        await createTransaction({
          ticker: formData.ticker.toUpperCase(),
          transaction_type_id: formData.transaction_type_id,
          strategy_code: formData.strategy_code,
          transaction_date: formData.transaction_date,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fees: parseFloat(formData.fees),
          transaction_currency: formData.transaction_currency,
          notes: formData.notes || undefined,
          ticker_name: companyName || undefined,
        });
      }

      resetForm();
      if (onClearSelection) onClearSelection();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    resetForm();
    if (onClearSelection) onClearSelection();
    if (onCancelEdit) onCancelEdit();
  };

  const labelCls = 'text-blue-200 text-sm font-medium';
  const inputCls = 'funding-input rounded-lg px-3 py-2 text-sm';
  const smallLabelCls = 'text-blue-300 text-[11px] mb-1 block';
  const groupTagCls = 'text-blue-300 text-[11px] mb-1 block font-medium';

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingTransaction ? 'Edit Transaction' : 'Quick Transaction Entry'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">* Required fields</p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.ticker || !formData.quantity || !formData.price}
            tooltip={editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            variant="primary"
            size="sm"
          />
          <GlassButton
            icon={RefreshCw}
            onClick={handleRefresh}
            tooltip="Reset Form"
            variant="secondary"
            size="sm"
          />
        </div>
      </div>

      {editingTransaction && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-md text-blue-200 text-sm">
          Note: You can only edit Fees and Notes. Core transaction details cannot be changed.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-md text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* ROW 1: Ticker + Company */}
      <div className="grid grid-cols-[92px_1fr] gap-4 items-center mb-5">
        <label className={labelCls}>Ticker <span className="text-rose-400">*</span></label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL"
            className={`${inputCls} w-24 uppercase ${tickerError ? 'border-2 border-rose-400' : ''} ${
              editingTransaction || mode === 'staging' || isPositionLocked ? 'bg-white/5 cursor-not-allowed' : ''
            }`}
            disabled={!!editingTransaction || mode === 'staging' || isPositionLocked}
          />
          <input
            type="text"
            value={companyName}
            placeholder="Company name will appear here"
            className={`${inputCls} flex-1 bg-white/5 cursor-not-allowed`}
            disabled
          />
          {isLoadingTicker ? (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center animate-pulse flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          ) : hasPosition !== null ? (
            <div className="relative group flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${hasPosition ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {hasPosition ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {hasPosition ? 'Open Position' : 'No Open Position'}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {tickerError && (
        <div className="grid grid-cols-[92px_1fr] gap-4 mb-3">
          <div />
          <p className="text-rose-400 text-sm">{tickerError}</p>
        </div>
      )}

      {hasPosition && positionStrategy && !isPositionLocked && (
        <div className="grid grid-cols-[92px_1fr] gap-4 mb-3">
          <div />
          <div className="p-2 bg-green-500/10 border border-green-400/30 rounded-md w-fit">
            <p className="text-green-300 text-xs font-medium">Current Strategy: {positionStrategy}</p>
          </div>
        </div>
      )}

      {/* ROWS 2 & 3: 2x2 grid (Strategy/Date left, Type/Details right) with single spanning divider */}
      <div
        className="grid gap-x-4 gap-y-5 items-start mb-5"
        style={{ gridTemplateColumns: '92px 220px 1px 1fr' }}
      >
        {/* Strategy (col 2, row 1) */}
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <span className={groupTagCls}>Strategy <span className="text-rose-400">*</span></span>
          <select
            value={formData.strategy_code}
            onChange={(e) => setFormData({ ...formData, strategy_code: e.target.value })}
            className={`${inputCls} w-full ${editingTransaction || isPositionLocked ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={(mode === 'staging') || editingTransaction != null || isPositionLocked}
          >
            {strategies.map(strategy => (
              <option key={strategy.strategy_code} value={strategy.strategy_code} className="bg-slate-800 text-white">
                {strategy.strategy_name}
              </option>
            ))}
          </select>
        </div>

        {/* Type (col 4, row 1) */}
        <div style={{ gridColumn: 4, gridRow: 1 }}>
          <span className={groupTagCls}>Type <span className="text-rose-400">*</span></span>
          <div className={`${editingTransaction || mode === 'staging' ? 'opacity-50 pointer-events-none' : ''} w-fit`}>
            <SegmentedPills
              options={[
                { value: 1, label: 'Buy', icon: <TrendingUp className="w-5 h-5" />, activeColor: 'bg-emerald-500' },
                { value: 2, label: 'Sell', icon: <TrendingDown className="w-5 h-5" />, activeColor: 'bg-rose-500' },
              ]}
              value={formData.transaction_type_id}
              onChange={(value) => setFormData({ ...formData, transaction_type_id: value })}
              showLabels={true}
            />
          </div>
        </div>

        {/* Single divider spanning both rows (col 3, rows 1-2) */}
        <div
          className="bg-gradient-to-b from-transparent via-white/20 to-transparent"
          style={{ gridColumn: 3, gridRow: '1 / span 2', width: '1px' }}
        />

        {/* Date (col 2, row 2) */}
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <span className={groupTagCls}>Date <span className="text-rose-400">*</span></span>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            className={`${inputCls} w-full ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={editingTransaction != null}
          />
        </div>

        {/* Details (col 4, row 2) */}
        <div style={{ gridColumn: 4, gridRow: 2 }}>
          <span className={groupTagCls}>Details</span>
          <div className="flex gap-2 flex-nowrap">
            <div>
              <span className={smallLabelCls}>Qty <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.0001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                className={`${inputCls} w-16 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
                disabled={editingTransaction != null}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Price <span className="text-rose-400">*</span></span>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="150.00"
                className={`${inputCls} w-20 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
                disabled={editingTransaction != null}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Fees</span>
              <input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                placeholder="0.00"
                className={`${inputCls} w-14`}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Currency</span>
              <input
                type="text"
                value={formData.transaction_currency}
                onChange={(e) => setFormData({ ...formData, transaction_currency: e.target.value.toUpperCase() })}
                placeholder="USD"
                maxLength={3}
                className={`${inputCls} w-16 uppercase ${
                  editingTransaction || mode === 'staging' || isPositionLocked ? 'bg-white/5 cursor-not-allowed' : ''
                }`}
                disabled={!!editingTransaction || mode === 'staging' || isPositionLocked}
              />
            </div>
            <div>
              <span className={smallLabelCls}>Trade Value</span>
              <input
                type="text"
                value={`$${formData.trade_value}`}
                readOnly
                className={`${inputCls} w-20 bg-white/5 cursor-not-allowed`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: Notes */}
      <div className="grid grid-cols-[92px_1fr] gap-4 items-start">
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