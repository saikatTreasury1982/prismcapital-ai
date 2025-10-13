'use client';

import { X, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Transaction } from '../../lib/types/transaction';
import { deleteTransaction } from '../../services/transactionServiceClient';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionDetailModal({ transaction, onClose, onEdit, onDelete }: TransactionDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{transaction.ticker}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                transaction.transaction_type_id === 1 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}
              </span>
            </div>
            <p className="text-blue-200 text-sm">
              {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Quantity</h3>
              <p className="text-white text-lg">{transaction.quantity.toLocaleString()} shares</p>
            </div>

            {/* Price per Share */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Price per Share</h3>
              <p className="text-white text-lg">${transaction.price.toFixed(2)}</p>
            </div>

            {/* Trade Value */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Trade Value</h3>
              <p className="text-white text-lg font-bold">${transaction.trade_value.toFixed(2)}</p>
            </div>

            {/* Fees */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Fees</h3>
              <p className="text-white text-lg">${transaction.fees.toFixed(2)}</p>
            </div>

            {/* Currency */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Currency</h3>
              <p className="text-white text-lg">{transaction.transaction_currency}</p>
            </div>

            {/* Exchange ID */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Exchange ID</h3>
              <p className="text-white text-lg">{transaction.exchange_id}</p>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Notes</h3>
              <p className="text-white leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-300">
            <div>
              <span className="font-semibold">Created:</span>{' '}
              {new Date(transaction.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Updated:</span>{' '}
              {new Date(transaction.updated_at).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons - Floating Bottom Right */}
          <div className="fixed bottom-6 right-6 flex gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(transaction);
                  onClose();
                }}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-blue-300 rounded-full border border-white/20 hover:border-blue-400/50 transition-all shadow-lg cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-rose-300 rounded-full border border-white/20 hover:border-rose-400/50 transition-all shadow-lg cursor-pointer"
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
                <h3 className="text-xl font-bold text-white mb-3">Delete Transaction?</h3>
                <p className="text-blue-200 mb-6">
                  Are you sure you want to delete this <strong>{transaction.transaction_type_id === 1 ? 'BUY' : 'SELL'}</strong> transaction for{' '}
                  <strong>{transaction.ticker}</strong> on {new Date(transaction.transaction_date).toLocaleDateString()}?
                  <br /><br />
                  <span className="text-rose-300 font-semibold">This will trigger automatic recalculation of trade lots and positions. This action cannot be undone.</span>
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
                        await deleteTransaction(transaction.transaction_id);
                        if (onDelete) {
                          await onDelete(transaction.transaction_id);
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