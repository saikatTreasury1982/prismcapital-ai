'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UpcomingDividend {
  dividend_id: number;
  ticker: string;
  ex_dividend_date: string;
  payment_date: string | null;
  dividend_per_share: number;
  shares_owned: number;
  total_dividend_amount: number;
  days_until: number;
}

export function UpcomingView() {
  const { data: session } = useSession();
  const [upcomingDividends, setUpcomingDividends] = useState<UpcomingDividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingDividends = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/dividends/upcoming?userId=${session.user.id}`);
        const data = await response.json();
        setUpcomingDividends(data.dividends || []);
      } catch (error) {
        console.error('Error fetching upcoming dividends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingDividends();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading upcoming dividends...</p>
      </div>
    );
  }

  if (upcomingDividends.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">No upcoming dividends found.</p>
      </div>
    );
  }

  // Calculate total expected
  const totalExpected = upcomingDividends.reduce((sum, d) => sum + d.total_dividend_amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-3xl p-6 border border-emerald-400/20">
        <p className="text-emerald-300 text-sm mb-1">Total Expected</p>
        <p className="text-white text-4xl font-bold">${totalExpected.toFixed(2)}</p>
        <p className="text-emerald-200 text-sm mt-2">{upcomingDividends.length} upcoming payments</p>
      </div>

      {/* Upcoming Dividends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingDividends.map((dividend) => (
          <div
            key={dividend.dividend_id}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{dividend.ticker}</h3>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                dividend.days_until <= 7
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : dividend.days_until <= 30
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'
              }`}>
                {dividend.days_until === 0 ? 'Today' : 
                 dividend.days_until === 1 ? 'Tomorrow' :
                 `${dividend.days_until} days`}
              </span>
            </div>

            {/* Dates */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-300">Ex-Dividend</span>
                <span className="text-white font-semibold">
                  {new Date(dividend.ex_dividend_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {dividend.payment_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-300">Payment</span>
                  <span className="text-white font-semibold">
                    {new Date(dividend.payment_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-300 text-sm mb-1">Expected Amount</p>
              <p className="text-emerald-400 text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ${dividend.total_dividend_amount.toFixed(2)}
              </p>
              <p className="text-blue-200 text-xs mt-2">
                ${dividend.dividend_per_share.toFixed(4)} × {dividend.shares_owned.toLocaleString()} shares
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}