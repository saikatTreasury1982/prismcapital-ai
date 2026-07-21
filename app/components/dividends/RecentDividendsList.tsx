'use client';

import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { Dividend } from '../../lib/types/dividend';
import { getRecentDividends } from '../../services/dividendServiceClient';

interface RecentDividendsListProps {
  refreshKey?: number;
  onDividendClick?: (dividend: Dividend) => void;
  editingDividendId?: number | null;
}

export function RecentDividendsList({ refreshKey = 0, onDividendClick, editingDividendId }: RecentDividendsListProps) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDividends = async () => {
      setLoading(true);
      try {
        const data = await getRecentDividends();
        setDividends(data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch recent dividends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDividends();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Recent Dividends
        </h2>
        <p className="text-blue-200 text-center py-8">Loading...</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Coins className="w-5 h-5" />
        Recent Dividends
      </h2>
      <p className="text-xs text-blue-300 mt-1 mb-3">
        Showing {dividends.length} most recent dividend{dividends.length !== 1 ? 's' : ''}
      </p>

      {dividends.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-blue-200 text-sm">No dividends yet</p>
          <p className="text-blue-300 text-xs mt-1">Your recent dividends will appear here</p>
        </div>
      ) : (
        <div>
          {dividends.map((dividend, idx) => {
            const isEditing = editingDividendId === dividend.dividend_id;
            return (
              <div
                key={dividend.dividend_id}
                onClick={() => onDividendClick?.(dividend)}
                className={`flex items-center justify-between py-2.5 px-2 border-t border-white/10 cursor-pointer transition-all ${
                  idx === dividends.length - 1 ? 'border-b' : ''
                } ${isEditing ? 'bg-emerald-500/20' : 'hover:bg-white/5'}`}
              >
                {/* Left: ticker + per-share tag */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-semibold text-sm">{dividend.ticker}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                    ${dividend.dividend_per_share.toFixed(2)}/sh
                  </span>
                </div>

                {/* Right: total + date */}
                <div className="text-right">
                  <div className="font-semibold text-sm text-emerald-400">
                    +${dividend.total_dividend_amount.toFixed(2)}
                    <span className="text-blue-300 text-[10px] font-normal ml-1">
                      {dividend.Currency || 'USD'}
                    </span>
                  </div>
                  <div className="text-blue-300 text-[11px]">
                    Ex-div{' '}
                    {new Date(dividend.ex_dividend_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}