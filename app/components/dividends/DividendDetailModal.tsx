'use client';

import { X } from 'lucide-react';
import { Dividend } from '../../lib/types/dividend';

interface DividendDetailModalProps {
  dividend: Dividend | null;
  onClose: () => void;
}

export function DividendDetailModal({ dividend, onClose }: DividendDetailModalProps) {
  if (!dividend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{dividend.ticker}</h2>
            <p className="text-blue-200 text-sm">
              Payment Date: {new Date(dividend.payment_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Ex-Dividend Date</h3>
              <p className="text-white">
                {new Date(dividend.ex_dividend_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Payment Date</h3>
              <p className="text-white">
                {new Date(dividend.payment_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Dividend Per Share</h3>
              <p className="text-white text-xl font-bold">
                ${dividend.dividend_per_share.toFixed(4)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Shares Owned</h3>
              <p className="text-white text-xl font-bold">
                {dividend.shares_owned.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
            <h3 className="text-sm font-semibold text-emerald-200 mb-2">Total Dividend Amount</h3>
            <p className="text-white text-3xl font-bold">
              ${dividend.total_dividend_amount.toFixed(2)}
            </p>
          </div>

          {dividend.dividend_yield && (
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Dividend Yield</h3>
              <p className="text-white">
                {(dividend.dividend_yield * 100).toFixed(2)}%
              </p>
            </div>
          )}

          {dividend.notes && (
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Notes</h3>
              <p className="text-white">{dividend.notes}</p>
            </div>
          )}

          <div className="text-xs text-blue-300">
            <p>Created: {new Date(dividend.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(dividend.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}