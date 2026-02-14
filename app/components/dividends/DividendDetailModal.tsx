'use client';

import { X, Edit2, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dividend } from '../../lib/types/dividend';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import BulletDisplay from '@/app/lib/ui/BulletDisplay';

interface DividendDetailModalProps {
  dividend: Dividend | null;
  onClose: () => void;
  onEdit?: (dividend: Dividend) => void;
  onDelete?: (dividendId: number) => void;
}

export function DividendDetailModal({ dividend, onClose, onEdit, onDelete }: DividendDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    ex_dividend_date: '',
    payment_date: '',
    dividend_per_share: '',
    shares_owned: '',
    notes: ''
  });

  // Reset state when modal opens/closes or dividend changes
  useEffect(() => {
    setIsEditing(false);
    setEditError(null);
  }, [dividend?.dividend_id]);

  if (!dividend) return null;

  const handleEditClick = () => {
    setIsEditing(true);
    setEditFormData({
      ex_dividend_date: dividend.ex_dividend_date,
      payment_date: dividend.payment_date || '',
      dividend_per_share: dividend.dividend_per_share.toString(),
      shares_owned: dividend.shares_owned.toString(),
      notes: dividend.notes || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.ex_dividend_date || !editFormData.dividend_per_share || !editFormData.shares_owned) {
      setEditError('Please fill in all required fields');
      return;
    }

    const dividendPerShare = parseFloat(editFormData.dividend_per_share);
    const sharesOwned = parseFloat(editFormData.shares_owned);

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/dividends/${dividend.dividend_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ex_dividend_date: editFormData.ex_dividend_date,
          payment_date: editFormData.payment_date || null,
          dividend_per_share: dividendPerShare,
          shares_owned: sharesOwned,
          notes: editFormData.notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update dividend');
      }

      // Call parent's onEdit callback if provided
      if (onEdit) {
        onEdit({
          ...dividend,
          ex_dividend_date: editFormData.ex_dividend_date,
          payment_date: editFormData.payment_date || null,
          dividend_per_share: dividendPerShare,
          shares_owned: sharesOwned,
          notes: editFormData.notes || null,
          total_dividend_amount: dividendPerShare * sharesOwned
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

  // Calculate total dividend amount for edit form
  const editTotalAmount = editFormData.dividend_per_share && editFormData.shares_owned
    ? (parseFloat(editFormData.dividend_per_share) * parseFloat(editFormData.shares_owned)).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            {!isEditing && onEdit && (
              <GlassButton
                icon={Edit2}
                onClick={handleEditClick}
                tooltip="Edit Dividend"
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
            {!isEditing && onDelete && (
              <GlassButton
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                tooltip="Delete Dividend"
                variant="secondary"
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

              {dividend.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Notes</h3>
                  <div className="text-white">
                    <BulletDisplay text={dividend.notes} />
                  </div>
                </div>
              )}

              <div className="text-xs text-blue-300">
                <p>Created: {new Date(dividend.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(dividend.updated_at).toLocaleString()}</p>
              </div>
            </>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Ex-Dividend Date */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Ex-Dividend Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    value={editFormData.ex_dividend_date}
                    onChange={(e) => setEditFormData({ ...editFormData, ex_dividend_date: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Payment Date</label>
                  <input
                    type="date"
                    value={editFormData.payment_date}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_date: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Dividend Per Share */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Dividend Per Share <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editFormData.dividend_per_share}
                    onChange={(e) => setEditFormData({ ...editFormData, dividend_per_share: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>

                {/* Shares Owned */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">Shares Owned <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.shares_owned}
                    onChange={(e) => setEditFormData({ ...editFormData, shares_owned: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Auto-calculated Total Amount */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm mb-2 font-medium">Total Dividend Amount (Calculated)</p>
                <p className="text-white text-2xl font-bold">${editTotalAmount}</p>
              </div>

              {/* Notes */}
              <div>
                <BulletTextarea
                  value={editFormData.notes}
                  onChange={(value) => setEditFormData({ ...editFormData, notes: value })}
                  placeholder="Add any additional notes (each line becomes a bullet point)..."
                  rows={4}
                  label="Notes (Optional)"
                  disabled={isSaving}
                  rounded={false}
                  scrollable={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Delete Dividend?</h3>
            <p className="text-blue-200 mb-6">
              Are you sure you want to delete this dividend entry for <strong>{dividend.ticker}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <GlassButton
                icon={X}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                tooltip="Cancel"
                variant="secondary"
                size="lg"
              />
              <GlassButton
                icon={Trash2}
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
                tooltip={isDeleting ? 'Deleting...' : 'Confirm Delete'}
                variant="secondary"
                size="lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}