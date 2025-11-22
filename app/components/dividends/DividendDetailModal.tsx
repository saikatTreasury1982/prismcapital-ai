'use client';

import { X, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Dividend } from '../../lib/types/dividend';

interface DividendDetailModalProps {
  dividend: Dividend | null;
  onClose: () => void;
  onEdit?: (dividend: Dividend) => void;
  onDelete?: (dividendId: number) => void;
}

export function DividendDetailModal({ dividend, onClose, onEdit, onDelete }: DividendDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!dividend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{dividend.ticker}</h2>
            <p className="text-blue-200 text-sm">
              {dividend.payment_date 
                ? `Payment Date: ${new Date(dividend.payment_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}`
                : 'Payment Date: Not set'
              }
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
                {dividend.payment_date 
                  ? new Date(dividend.payment_date).toLocaleDateString()
                  : 'Not set'
                }
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
              ${(dividend.total_dividend_amount || 0).toFixed(2)}
            </p>
          </div>

          {dividend.dividend_yield && (
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Dividend Yield</h3>
              <p className="text-white">
                {((dividend.dividend_yield * 100)||0).toFixed(2)}%
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

          {/* Action Buttons - Floating Bottom Right */}
          <div className="fixed bottom-6 right-6 flex gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(dividend);
                  onClose();
                }}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-blue-300 rounded-full border border-white/20 hover:border-blue-400/50 transition-all shadow-lg"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-rose-300 rounded-full border border-white/20 hover:border-rose-400/50 transition-all shadow-lg"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
              <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
                <h3 className="text-xl font-bold text-white mb-3">Delete Dividend Entry?</h3>
                <p className="text-blue-200 mb-6">
                  Are you sure you want to delete this dividend entry for <strong>{dividend.ticker}</strong> on {new Date(dividend.ex_dividend_date).toLocaleDateString()}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        if (onDelete) {
                          await onDelete(dividend.dividend_id);
                        }
                        onClose();
                      } catch (err) {
                        console.error('Delete failed:', err);
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}