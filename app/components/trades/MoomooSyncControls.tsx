'use client';

import { useState } from 'react';
import { Download, RefreshCw, ChevronDown, ChevronUp, Clock, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { MoomooService, getMoomooMarketCurrency, getMoomooTransactionType } from '@/app/services/moomooService';

interface MoomooSyncControlsProps {
  onSyncComplete: () => void;
}

export function MoomooSyncControls({ onSyncComplete }: MoomooSyncControlsProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const handleFetchTrades = async () => {
    // Validate dates
    if (!startDate || !endDate) {
      setError('Both From and To dates are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('From date cannot be after To date');
      return;
    }

    setError(null);
    setIsFetching(true);

    try {
      // Step 1: Fetch Moomoo API key from database
      const configResponse = await fetch('/api/moomoo/connection');
      const configData = await configResponse.json();
      
      if (!configData.connected) {
        throw new Error('Moomoo API not configured. Please add API key in system settings.');
      }

      // Step 2: Connect to Moomoo OpenD
      const moomooService = new MoomooService({
        ip: '127.0.0.1',
        port: 33333,
        apiKey: 'pk_5a8f9c2b4e3d1' // This should come from API
      });

      await moomooService.connect();

      // Step 3: Fetch trades
      const deals = await moomooService.fetchTrades(startDate, endDate);
      
      if (deals.length === 0) {
        alert('No trades found for the selected date range.');
        moomooService.disconnect();
        setIsFetching(false);
        return;
      }

      // Step 4: Fetch fees
      const orderIds = deals.map(d => d.order_id);
      const fees = await moomooService.fetchFees(orderIds);
      
      // Create fee lookup map
      const feeMap = new Map(fees.map(f => [f.order_id, f.fee_amount]));

      // Step 5: Map to staging format
      const stagingRecords = deals.map(deal => ({
        moomoo_fill_id: deal.deal_id,
        moomoo_order_id: deal.order_id,
        ticker: deal.code,
        ticker_name: deal.name,
        transaction_type_id: getMoomooTransactionType(deal.trd_side),
        transaction_date: deal.create_time.split('T')[0], // Extract date only
        quantity: deal.qty,
        price: deal.price,
        fees: feeMap.get(deal.order_id) || 0,
        transaction_currency: getMoomooMarketCurrency(deal.trd_market),
        strategy_code: null,
        notes: null
      }));

      // Step 6: Insert into staging table
      const insertResponse = await fetch('/api/moomoo/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: stagingRecords })
      });

      if (!insertResponse.ok) {
        throw new Error('Failed to insert trades into staging');
      }

      const insertData = await insertResponse.json();
      
      alert(`✅ Successfully imported ${insertData.insertedCount} trade(s) to staging table!\n\nPlease review and assign strategies before releasing.`);
      
      // Disconnect
      moomooService.disconnect();
      
      // Refresh staging table
      onSyncComplete();

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch trades from Moomoo');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 sm:p-6 border border-white/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Fetch from Moomoo</h3>
        <GlassButton
          icon={showControls ? ChevronUp : ChevronDown}
          onClick={() => setShowControls(!showControls)}
          tooltip={showControls ? 'Hide Controls' : 'Show Controls'}
          variant="secondary"
          size="sm"
        />
      </div>

      {showControls && (
        <div className="space-y-4">
            {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
                {error}
            </div>
            )}

            {/* Single-line layout */}
            <div className="flex items-end gap-3 flex-wrap">
            {/* Quick Select Buttons */}
            <div className="flex items-center gap-2">
                <span className="text-blue-200 text-sm font-medium">Quick Select:</span>
                <GlassButton
                icon={Clock}
                onClick={() => handleQuickSelect(0)}
                tooltip="Today"
                variant="secondary"
                size="sm"
                />
                <GlassButton
                icon={Calendar}
                onClick={() => handleQuickSelect(7)}
                tooltip="Last 7 Days"
                variant="secondary"
                size="sm"
                />
                <GlassButton
                icon={CalendarDays}
                onClick={() => handleQuickSelect(30)}
                tooltip="Last 30 Days"
                variant="secondary"
                size="sm"
                />
                <GlassButton
                icon={CalendarRange}
                onClick={() => handleQuickSelect(90)}
                tooltip="Last 90 Days"
                variant="secondary"
                size="sm"
                />
            </div>

            {/* From Date */}
            <div className="flex-shrink-0">
                <label className="text-blue-200 text-xs mb-1 block">From Date</label>
                <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="funding-input rounded-xl px-3 py-2 text-sm w-40"
                />
            </div>

            {/* To Date */}
            <div className="flex-shrink-0">
                <label className="text-blue-200 text-xs mb-1 block">To Date</label>
                <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="funding-input rounded-xl px-3 py-2 text-sm w-40"
                />
            </div>

            {/* Fetch Button */}
            <div className="relative">
                <GlassButton
                icon={Download}
                onClick={handleFetchTrades}
                disabled={isFetching}
                tooltip={isFetching ? 'Fetching trades from Moomoo...' : 'Fetch Trades from Moomoo'}
                variant="primary"
                size="md"
                />
                {isFetching && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                </div>
                )}
            </div>
            </div>

            <p className="text-blue-300 text-xs">
            ℹ️ Trades will be imported to staging table for review before release.
            </p>
        </div>
        )}
    </div>
  );
}