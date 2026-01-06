'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '../../lib/types/transaction';
import { createTransaction, updateTransaction } from '../../services/transactionServiceClient';
import { useDebounce } from '../../lib/hooks/useDebounce';
import GlassButton from '@/app/lib/ui/GlassButton';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { Plus, Save, XCircle, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import { StagingRecord } from '@/app/lib/types/moomoo';


interface TransactionEntryFormProps {
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  mode?: 'create' | 'edit' | 'staging';
  stagingRecord?: StagingRecord; // ✅ Full staging record, not just metadata
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
  stagingRecord
}: TransactionEntryFormProps) {
  const [isStagingEditMode, setIsStagingEditMode] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [formData, setFormData] = useState({
    ticker: '',
    transaction_type_id: 1, // Default to Buy
    strategy_code: 'LONG_TERM', // Default to Long Term strategy
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
            
            if (positionData.data && positionData.data.strategy) {
              // Find strategy name from strategies list
              const strategy = strategies.find(s => s.strategy_code === positionData.data.strategy);
              
              if (strategy) {
                const strategyText = `${strategy.strategy_name}`;
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

  // Pre-fill form when editing or viewing staging record
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
        trade_value: editingTransaction.trade_value.toString()
      });
    } else if (mode === 'staging' && stagingRecord) {
      // Pre-fill from staging data
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
        trade_value: stagingRecord.trade_value?.toString() || '0'
      });
      
      if (stagingRecord.ticker_name) {
        setCompanyName(stagingRecord.ticker_name);
      }
    }
  }, [editingTransaction, mode, stagingRecord]);

  const handleSubmit = async () => {

    // Validation
    if (!formData.ticker || !formData.transaction_date || !formData.quantity || !formData.price) {
      setError('Ticker, Date, Quantity, and Price are required');
      return;
    }

    // Note: Strategy is NOT required for staging edits
    // Strategy will be validated when releasing to transactions
      setError(null);
      setIsSubmitting(true);

    try {    
      if (mode === 'staging' && stagingRecord?.staging_id) {        
        const requestBody = {
          strategy_code: formData.strategy_code,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fees: parseFloat(formData.fees),
          transaction_currency: formData.transaction_currency,
          notes: formData.notes || null,
          transaction_date: formData.transaction_date,
          status: 'edited'
        };
        
        // Update staging record
        const response = await fetch(`/api/moomoo/staging/${stagingRecord.staging_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update staging record');
        }

        const responseData = await response.json();

        // Exit edit mode
        setIsStagingEditMode(false);
        
        if (onCancelEdit) {
          onCancelEdit();
          console.log('✅ onCancelEdit called');
        } else {
          console.log('⚠️ onCancelEdit is not defined!');
        }
        
        // Then trigger refresh
        onSuccess();

        return;
      
      } 
      else if (editingTransaction) {
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
          strategy_code: formData.strategy_code,
          transaction_date: formData.transaction_date,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fees: parseFloat(formData.fees),
          transaction_currency: formData.transaction_currency,
          notes: formData.notes || undefined,
          ticker_name: companyName || undefined
        });
      }

      // Reset form (only if not in staging mode)
      if (mode !== 'staging') {
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
          trade_value: '0'
        });
        setCompanyName('');
        setHasPosition(null);
        setPositionStrategy(null);
      }

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
      strategy_code: 'LONG_TERM', // ✅ Or use the first strategy from your strategies array
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
    <div className={mode === 'staging' ? 'p-6 sm:p-8' : 'backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20'}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6" />
            {mode === 'staging' ? 'Review Imported Trade' : 
            editingTransaction ? 'Edit Transaction' : 
            'Quick Transaction Entry'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">* Required fields</p>
        </div>
        <div className="flex gap-2">
          {mode === 'staging' ? (
            // Staging mode buttons
            <>
              {isStagingEditMode ? (
                // Edit mode: Save (left) + Cancel (right)
                <>
                  <GlassButton
                    icon={Save}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    tooltip="Save Changes"
                    variant="primary"
                    size="md"
                  />
                  <GlassButton
                    icon={XCircle}
                    onClick={() => {
                      setIsStagingEditMode(false);
                      if (stagingRecord) {
                        // Reset form to original values
                        setFormData({
                          ticker: stagingRecord.ticker,
                          transaction_type_id: stagingRecord.transaction_type_id,
                          strategy_code: stagingRecord.strategy_code || '',
                          transaction_date: stagingRecord.transaction_date,
                          quantity: stagingRecord.quantity.toString(),
                          price: stagingRecord.price.toString(),
                          fees: stagingRecord.fees.toString(),
                          transaction_currency: stagingRecord.transaction_currency,
                          notes: stagingRecord.notes || '',
                          trade_value: stagingRecord.trade_value.toString()
                        });
                      }
                    }}
                    tooltip="Cancel Edit"
                    variant="secondary"
                    size="md"
                  />
                </>
              ) : (
                // View mode: Edit (left) + Close (right)
                <>
                  <GlassButton
                    icon={Edit2}
                    onClick={() => setIsStagingEditMode(true)}
                    tooltip="Edit Trade"
                    variant="primary"
                    size="md"
                  />
                  <GlassButton
                    icon={XCircle}
                    onClick={handleCancel}
                    tooltip="Close"
                    variant="secondary"
                    size="md"
                  />
                </>
              )}
            </>
          ) : (
            // Normal mode buttons
            <>
              <GlassButton
                icon={Save}
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.ticker || !formData.quantity || !formData.price}
                tooltip={editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                variant="primary"
                size="md"
              />
              <GlassButton
                icon={XCircle}
                onClick={handleCancel}
                tooltip="Clear Form"
                variant="secondary"
                size="md"
              />
            </>
          )}
        </div>
      </div>

      {editingTransaction && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 text-sm">
          Note: You can only edit Fees and Notes. Core transaction details cannot be changed.
        </div>
      )}

      {/* Moomoo Import Info - Only shown in staging mode */}
      {mode === 'staging' && stagingRecord && (
        <div className="mb-4 space-y-3">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className={`
              px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2
              ${stagingRecord.status === 'imported' ? 'bg-blue-500/20 border border-blue-400/30 text-blue-200' : ''}
              ${stagingRecord.status === 'edited' ? 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-200' : ''}
              ${stagingRecord.status === 'rejected_duplicate' ? 'bg-red-500/20 border border-red-400/30 text-red-200' : ''}
              ${stagingRecord.status === 'rejected_error' ? 'bg-orange-500/20 border border-orange-400/30 text-orange-200' : ''}
            `}>
              <span className="text-lg">
                {stagingRecord.status === 'imported' && '📥'}
                {stagingRecord.status === 'edited' && '✏️'}
                {stagingRecord.status === 'rejected_duplicate' && '❌'}
                {stagingRecord.status === 'rejected_error' && '⚠️'}
              </span>
              <span>
                {stagingRecord.status === 'imported' && 'Imported from Moomoo'}
                {stagingRecord.status === 'edited' && 'Edited (Modified after import)'}
                {stagingRecord.status === 'rejected_duplicate' && 'Rejected - Duplicate Entry'}
                {stagingRecord.status === 'rejected_error' && 'Rejected - Error'}
              </span>
            </div>
          </div>

          {/* Moomoo Order IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stagingRecord.moomoo_order_id && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-blue-200 text-xs mb-1">Moomoo Order ID</p>
                <p className="text-white text-sm font-mono break-all">{stagingRecord.moomoo_order_id}</p>
              </div>
            )}
            {stagingRecord.moomoo_fill_id && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-blue-200 text-xs mb-1">Moomoo Fill ID</p>
                <p className="text-white text-sm font-mono break-all">{stagingRecord.moomoo_fill_id}</p>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {stagingRecord.rejection_reason && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
              <p className="text-red-200 text-xs mb-1 font-semibold">Rejection Reason</p>
              <p className="text-red-100 text-sm">{stagingRecord.rejection_reason}</p>
            </div>
          )}
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
              } ${editingTransaction || mode === 'staging' ? 'bg-white/5 cursor-not-allowed' : ''}`}
              disabled={!!editingTransaction || mode === 'staging'}
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
            value={formData.strategy_code}
            onChange={(e) => setFormData({ ...formData, strategy_code: e.target.value })}
            className={`w-full funding-input rounded-xl px-4 py-3 ${editingTransaction ? 'bg-white/5 cursor-not-allowed' : ''}`}
            disabled={mode === 'staging' && !isStagingEditMode}
          >
            {strategies.map(strategy => (
              <option key={strategy.strategy_code} value={strategy.strategy_code} className="bg-slate-800 text-white">
                {strategy.strategy_name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Type *</label>
          <div className={editingTransaction || mode === 'staging' ? 'opacity-50 pointer-events-none' : ''}>
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
            disabled={mode === 'staging' && !isStagingEditMode}
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
            disabled={mode === 'staging' && !isStagingEditMode}
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
            disabled={mode === 'staging' && !isStagingEditMode}
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
            disabled={mode === 'staging' && !isStagingEditMode}
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
            disabled={!!editingTransaction || mode === 'staging'}
            maxLength={3}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
          <BulletTextarea
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={4}
            placeholder="Optional notes (use • for bullet points)..."
            disabled={mode === 'staging' && !isStagingEditMode}
          />
        </div>
      </div>
    </div>
  );
}