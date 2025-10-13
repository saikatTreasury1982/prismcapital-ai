'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Transaction, Exchange, CreateTransactionInput } from '../../lib/types/transaction';
import { createTransaction, updateTransaction } from '../../services/transactionServiceClient';
import { getExchanges } from '../../services/exchangeServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';
import { useDebounce } from '../../lib/hooks/useDebounce';

interface TransactionEntryFormProps {
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export function TransactionEntryForm({ onSuccess, editingTransaction, onCancelEdit }: TransactionEntryFormProps) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [formData, setFormData] = useState({
    ticker: '',
    exchange_id: 1, // Default to NYSE
    transaction_type_id: 1, // Default to Buy
    transaction_date: new Date().toISOString().split('T')[0],
    quantity: '',
    price: '',
    fees: '0',
    transaction_currency: 'USD',
    notes: '',
    trade_value: '0'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPosition, setHasPosition] = useState<boolean | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  const debouncedTicker = useDebounce(formData.ticker, 500);

  // Fetch exchanges on mount
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const data = await getExchanges();
        setExchanges(data);
      } catch (err) {
        console.error('Failed to fetch exchanges:', err);
      }
    };
    fetchExchanges();
  }, []);

  // Auto-calculate trade value
  useEffect(() => {
    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    
    if (!isNaN(quantity) && !isNaN(price)) {
      const tradeValue = quantity * price;
      setFormData(prev => ({
        ...prev,
        trade_value: tradeValue.toFixed(2)
      }));
    }
  }, [formData.quantity, formData.price]);

  // Fetch ticker info when user stops typing
  useEffect(() => {
    const fetchTickerData = async () => {
      if (!debouncedTicker) {
        setHasPosition(null);
        setTickerError(null);
        setCompanyName('');
        return;
      }

      setIsLoadingTicker(true);
      setTickerError(null);

      try {
        // Check positions table first
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}&userId=${CURRENT_USER_ID}`);
        const posData = await posRes.json();
        
        setHasPosition(posData.hasPosition);

        // Use ticker_name from positions if available
        if (posData.hasPosition && posData.tickerName) {
          setCompanyName(posData.tickerName);
          setTickerError(null);
        } else {
          // Fallback to AlphaVantage
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
      } finally {
        setIsLoadingTicker(false);
      }
    };

    fetchTickerData();
  }, [debouncedTicker]);

  // Pre-fill form when editing (only fees and notes)
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ticker: editingTransaction.ticker,
        exchange_id: editingTransaction.exchange_id,
        transaction_type_id: editingTransaction.transaction_type_id,
        transaction_date: editingTransaction.transaction_date,
        quantity: editingTransaction.quantity.toString(),
        price: editingTransaction.price.toString(),
        fees: editingTransaction.fees.toString(),
        transaction_currency: editingTransaction.transaction_currency,
        notes: editingTransaction.notes || '',
        trade_value: editingTransaction.trade_value.toString()
      });
    }
  }, [editingTransaction]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.ticker || !formData.transaction_date || !formData.quantity || !formData.price) {
      setError('Ticker, Date, Quantity, and Price are required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingTransaction) {
        // Update existing transaction (only fees and notes)
        await updateTransaction(editingTransaction.transaction_id, {
          fees: parseFloat(formData.fees),
          notes: formData.notes || undefined
        });
      } else {
        // Create new transaction
        await createTransaction(CURRENT_USER_ID, {
          ticker: formData.ticker.toUpperCase(),
          exchange_id: formData.exchange_id,
          transaction_type_id: formData.transaction_type_id,
          transaction_date: formData.transaction_date,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fees: parseFloat(formData.fees),
          transaction_currency: formData.transaction_currency,
          notes: formData.notes || undefined
        });
      }

      // Reset form
      setFormData({
        ticker: '',
        exchange_id: 1,
        transaction_type_id: 1,
        transaction_date: new Date().toISOString().split('T')[0],
        quantity: '',
        price: '',
        fees: '0',
        transaction_currency: 'USD',
        notes: '',
        trade_value: '0'
      });
      setCompanyName('');
      setHasPosition(null);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Plus className="w-6 h-6" />
        {editingTransaction ? 'Edit Transaction' : 'Quick Transaction Entry'}
      </h2>

      {editingTransaction && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 text-sm">
          Note: You can only edit Fees and Notes. Core transaction details cannot be changed.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ticker */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker *</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              placeholder="AAPL"
              className={`flex-1 funding-input rounded-xl px-4 py-3 uppercase max-w-[70%] ${
                tickerError ? 'border-2 border-rose-400' : ''
              } ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
              disabled={!!editingTransaction}
              required
            />
            {isLoadingTicker ? (
              <span className="px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap bg-blue-600 text-white">
                Loading...
              </span>
            ) : hasPosition !== null ? (
              <span
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  hasPosition ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}
              >
                {hasPosition ? 'Open Position' : 'No Position'}
              </span>
            ) : null}
          </div>
          {tickerError && (
            <p className="text-rose-400 text-sm mt-2">{tickerError}</p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Company Name</label>
          <input
            type="text"
            value={companyName}
            placeholder="Company name will appear here"
            className="w-full funding-input rounded-xl px-4 py-3 bg-white/5 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Exchange */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Exchange *</label>
          <select
            value={formData.exchange_id}
            onChange={(e) => setFormData({ ...formData, exchange_id: parseInt(e.target.value) })}
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
          >
            {exchanges.map(exchange => (
              <option key={exchange.exchange_id} value={exchange.exchange_id} className="bg-slate-800 text-white">
                {exchange.exchange_code} - {exchange.exchange_name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Type *</label>
          <div className={`inline-flex rounded-xl overflow-hidden border border-white/20 ${editingTransaction ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type_id: 1 })}
              disabled={!!editingTransaction}
              className={`px-6 py-3 font-semibold transition-all ${
                formData.transaction_type_id === 1
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-blue-200 hover:bg-white/10'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type_id: 2 })}
              disabled={!!editingTransaction}
              className={`px-6 py-3 font-semibold transition-all ${
                formData.transaction_type_id === 2
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-blue-200 hover:bg-white/10'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Transaction Date */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Date *</label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Quantity (Shares) *</label>
          <input
            type="number"
            step="0.0001"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="100"
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Price per Share *</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="150.00"
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
            required
          />
        </div>

        {/* Fees */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Fees</label>
          <input
            type="number"
            step="0.01"
            value={formData.fees}
            onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            placeholder="0.00"
            className="w-full funding-input rounded-xl px-4 py-3"
          />
        </div>

        {/* Trade Value (auto-calculated) */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Trade Value</label>
          <input
            type="text"
            value={`$${formData.trade_value}`}
            readOnly
            className="w-full funding-input rounded-xl px-4 py-3 bg-white/5 cursor-not-allowed"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Currency</label>
          <input
            type="text"
            value={formData.transaction_currency}
            onChange={(e) => setFormData({ ...formData, transaction_currency: e.target.value.toUpperCase() })}
            placeholder="USD"
            className={`w-full funding-input rounded-xl px-4 py-3 uppercase ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
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

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.ticker || !formData.quantity || !formData.price}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Save Transaction')}
        </button>
        {editingTransaction && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="px-6 bg-slate-600 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mt-3 text-center text-xs text-blue-300">
        * Required fields
      </div>
    </div>
  );
}