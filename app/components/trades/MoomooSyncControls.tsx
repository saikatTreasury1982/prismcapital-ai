'use client';

import { useState } from 'react';
import { Download, RefreshCw, ChevronDown, ChevronUp, Clock, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import GlassButton from '@/app/lib/ui/GlassButton';

interface MoomooSyncControlsProps {
  onSyncComplete: () => void;
}

export function MoomooSyncControls({ onSyncComplete }: MoomooSyncControlsProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const handleSync = async () => {
    if (syncing) return;

    // Validate dates
    if (!startDate || !endDate) {
      setError('Both From and To dates are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('From date cannot be after To date');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      // Format dates for Moomoo API (YYYY-MM-DD HH:MM:SS)
      const beginTime = `${startDate} 00:00:00`;
      const endTime = `${endDate} 23:59:59`;

      const response = await fetch('/api/moomoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beginTime, endTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Show success message
      alert(`✅ ${data.message}\n\nImported ${data.count} trades to staging table.\n\nPlease review and assign strategies before releasing.`);

      // Refresh the staging table
      onSyncComplete();
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to sync trades');
    } finally {
      setSyncing(false);
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

            {/* Sync Button */}
            <div className="relative">
              <GlassButton
                icon={Download}
                onClick={handleSync}
                disabled={syncing}
                tooltip={syncing ? 'Syncing trades from Moomoo...' : 'Sync Trades from Moomoo'}
                variant="primary"
                size="md"
              />
              {syncing && (
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