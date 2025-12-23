'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Transaction, CreateTransactionInput } from '../../lib/types/transaction';
import { createTransaction, updateTransaction } from '../../services/transactionServiceClient';
import { useDebounce } from '../../lib/hooks/useDebounce';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { Save, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionEntryFormProps {
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

interface Strategy {
  strategy_id: number;
  strategy_code: string;
  strategy_name: string;
  description: string;
}

export function TransactionEntryForm({ onSuccess, editingTransaction, onCancelEdit }: TransactionEntryFormProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [formData, setFormData] = useState({
    ticker: '',
    transaction_type_id: 1, // Default to Buy
    strategy_id: 1, // Default to strategy 1
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
  const [positionStrategy, setPositionStrategy] = useState<string | null>(null);

  const debouncedTicker = useDebounce(formData.ticker, 500);

  // Fetch strategies on mount
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
        setPositionStrategy(null);
        return;
      }

      // Don't fetch if strategies aren't loaded yet
      if (strategies.length === 0) {
        console.log('Waiting for strategies to load...');
        return;
      }

      setIsLoadingTicker(true);
      setTickerError(null);

      try {
        // Check positions table first
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}`);
        const posData = await posRes.json();
        
        setHasPosition(posData.hasPosition);

        // If has position, fetch the strategy info
        if (posData.hasPosition) {
          console.log('Fetching position details for:', debouncedTicker);
          // Get position details including strategy
          const positionRes = await fetch(`/api/positions/${encodeURIComponent(debouncedTicker)}`);
          console.log('Position API response status:', positionRes.status);
          
          if (positionRes.ok) {
            const positionData = await positionRes.json();
            console.log('Position data:', positionData);
            console.log('Available strategies:', strategies);
            
            if (positionData.data && positionData.data.strategy_id) {
              console.log('Position strategy_id:', positionData.data.strategy_id);
              // Find strategy name from strategies list
              const strategy = strategies.find(s => s.strategy_id === positionData.data.strategy_id);
              console.log('Found strategy:', strategy);
              
              if (strategy) {
                const strategyText = `${strategy.strategy_id} - ${strategy.strategy_name}`;
                console.log('Setting position strategy to:', strategyText);
                setPositionStrategy(strategyText);
              } else {
                console.log('Strategy not found in strategies list');
                setPositionStrategy(null);
              }
            } else {
              console.log('No strategy_id in position data or no position data');
              setPositionStrategy(null);
            }
          } else {
            console.log('Position API call failed');
            setPositionStrategy(null);
          }
        } else {
          console.log('No position for this ticker');
          setPositionStrategy(null);
        }

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
        setPositionStrategy(null);
      } finally {
        setIsLoadingTicker(false);
      }
    };

    fetchTickerData();
  }, [debouncedTicker, strategies]);

  // Pre-fill form when editing (only fees and notes)
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ticker: editingTransaction.ticker,
        transaction_type_id: editingTransaction.transaction_type_id,
        strategy_id: 1, // Default strategy
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
        await createTransaction({
          ticker: formData.ticker.toUpperCase(),
          transaction_type_id: formData.transaction_type_id,
          strategy_id: formData.strategy_id,
          transaction_date: formData.transaction_date,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fees: parseFloat(formData.fees),
          transaction_currency: formData.transaction_currency,
          notes: formData.notes || undefined,
          ticker_name: companyName || undefined
        });
      }

      // Reset form
      setFormData({
        ticker: '',
        transaction_type_id: 1,
        strategy_id: 1,
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
      setPositionStrategy(null);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ticker: '',
      transaction_type_id: 1,
      strategy_id: 1,
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
    setError(null);
    setTickerError(null);
    setPositionStrategy(null);

    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          <Plus className="w-6 h-6" />
          {editingTransaction ? 'Edit Transaction' : 'Quick Transaction Entry'}
        </h2>
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
            disabled={isSubmitting || !formData.ticker || !formData.quantity || !formData.price}
            tooltip={editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            variant="primary"
            size="md"
          />
        </div>
      </div>

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
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            ) : hasPosition !== null ? (
              <div className="relative group">
                {hasPosition ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Open Position
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      No Open Position
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
          {tickerError && (
            <p className="text-rose-400 text-sm mt-2">{tickerError}</p>
          )}
          {hasPosition && positionStrategy && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-400/30 rounded-lg">
              <p className="text-green-300 text-xs font-medium">
                Current Strategy: {positionStrategy}
              </p>
            </div>
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

        {/* Strategy */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Strategy *</label>
          <select
            value={formData.strategy_id}
            onChange={(e) => setFormData({ ...formData, strategy_id: parseInt(e.target.value) })}
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={!!editingTransaction}
          >
            {strategies.map(strategy => (
              <option key={strategy.strategy_id} value={strategy.strategy_id} className="bg-slate-800 text-white">
                {strategy.strategy_id} - {strategy.strategy_name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Type *</label>
          <div className={editingTransaction ? 'opacity-50 pointer-events-none' : ''}>
            <SegmentedControl
              options={[
                { value: 1, label: 'Buy', icon: <TrendingUp className="w-5 h-5" /> },
                { value: 2, label: 'Sell', icon: <TrendingDown className="w-5 h-5" /> },
              ]}
              value={formData.transaction_type_id}
              onChange={(value) => setFormData({ ...formData, transaction_type_id: value })}
            />
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

      <div className="mt-3 text-center text-xs text-blue-300">
        * Required fields
      </div>
    </div>
  );
}