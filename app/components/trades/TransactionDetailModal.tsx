'use client';

import { X, Save, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Transaction } from '../../lib/types/transaction';
import GlassButton from '@/app/lib/ui/GlassButton';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: number) => void;
}

export function TransactionDetailModal({ transaction, onClose, onEdit }: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    transaction_date: '',
    quantity: '',
    price: '',
    fees: '',
    notes: ''
  });

  if (!transaction) return null;

  const handleEditClick = () => {
    setIsEditing(true);
    setEditFormData({
      transaction_date: transaction.transaction_date,
      quantity: transaction.quantity.toString(),
      price: transaction.price.toString(),
      fees: transaction.fees.toString(),
      notes: transaction.notes || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.transaction_date || !editFormData.quantity || !editFormData.price) {
      setEditError('Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(editFormData.quantity);
    const price = parseFloat(editFormData.price);
    const fees = parseFloat(editFormData.fees);

    if (isNaN(quantity) || isNaN(price) || isNaN(fees)) {
      setEditError('Please enter valid numbers');
      return;
    }

    if (quantity <= 0 || price <= 0 || fees < 0) {
      setEditError('Invalid values entered');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/transactions/${transaction.transaction_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_date: editFormData.transaction_date,
          quantity: quantity,
          price: price,
          fees: fees,
          notes: editFormData.notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      // Call parent's onEdit callback if provided
      if (onEdit) {
        onEdit({ ...transaction, 
          transaction_date: editFormData.transaction_date,
          quantity: quantity,
          price: price,
          fees: fees,
          notes: editFormData.notes || undefined
        });
      }

      onClose();
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  // Calculate trade value for edit form
  const editTradeValue = editFormData.quantity && editFormData.price
    ? (parseFloat(editFormData.quantity) * parseFloat(editFormData.price)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            {!isEditing && (
              <GlassButton
                icon={Edit2}
                onClick={handleEditClick}
                tooltip="Edit Transaction"
                variant="primary"
                size="md"
              />
            )}
            {isEditing && (
              <GlassButton
                icon={Save}
                onClick={handleSaveEdit}
                disabled={isSaving}
                tooltip={isSaving ? 'Saving...' : 'Save Changes'}
                variant="primary"
                size="md"
              />
            )}
            <GlassButton
              icon={X}
              onClick={isEditing ? handleCancelEdit : onClose}
              disabled={isSaving}
              tooltip={isEditing ? 'Cancel' : 'Close'}
              variant="secondary"
              size="md"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {editError && (
            <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
              {editError}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <>
              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Quantity</h3>
                  <p className="text-white text-lg">{transaction.quantity.toLocaleString()} shares</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Price per Share</h3>
                  <p className="text-white text-lg">${transaction.price.toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Trade Value</h3>
                  <p className="text-white text-lg font-bold">${transaction.trade_value.toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Fees</h3>
                  <p className="text-white text-lg">${transaction.fees.toFixed(2)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Currency</h3>
                  <p className="text-white text-lg">{transaction.transaction_currency}</p>
                </div>
              </div>

              {transaction.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Notes</h3>
                  <p className="text-white leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                    {transaction.notes}
                  </p>
                </div>
              )}

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
            </>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              {/* Transaction Date */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Date *</label>
                <input
                  type="date"
                  value={editFormData.transaction_date}
                  onChange={(e) => setEditFormData({ ...editFormData, transaction_date: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Price per Share *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Fees */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Fees</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.fees}
                  onChange={(e) => setEditFormData({ ...editFormData, fees: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>

              {/* Auto-calculated Trade Value */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-2 font-medium">Trade Value (Calculated)</p>
                <p className="text-white text-xl font-bold">${editTradeValue}</p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3 resize-none"
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}