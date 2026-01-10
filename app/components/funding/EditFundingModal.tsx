'use client';

import { X, Edit2, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CashMovementWithDirection } from '../../lib/types/funding';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea, BulletDisplay } from '@/app/lib/ui/BulletTextarea';
import SegmentedControl from '@/app/lib/ui/SegmentedControl';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EditFundingModalProps {
  movement: CashMovementWithDirection | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditFundingModal({ movement, onClose, onSuccess }: EditFundingModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>([]);
  
  const [editFormData, setEditFormData] = useState({
    home_currency_code: '',
    home_currency_value: '',
    trading_currency_code: '',
    spot_rate: '',
    direction_id: 1,
    transaction_date: '',
    period_from: '',
    period_to: '',
    notes: ''
  });

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('/api/currencies');
        const result = await response.json();
        setCurrencies(result.data || []);
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
      }
    };
    
    fetchCurrencies();
  }, []);

  if (!movement) return null;

  // Initialize form data when modal opens
  useEffect(() => {
    if (movement) {
      setEditFormData({
        home_currency_code: movement.home_currency_code,
        home_currency_value: movement.home_currency_value.toString(),
        trading_currency_code: movement.trading_currency_code,
        spot_rate: movement.spot_rate.toString(),
        direction_id: movement.direction_id,
        transaction_date: movement.transaction_date,
        period_from: movement.period_from || '',
        period_to: movement.period_to || '',
        notes: movement.notes || ''
      });
      setEditError(null);
    }
  }, [movement]);

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.home_currency_value || !editFormData.spot_rate || !editFormData.transaction_date) {
      setEditError('Amount, Exchange Rate, and Transaction Date are required');
      return;
    }

    const homeValue = parseFloat(editFormData.home_currency_value);
    const spotRate = parseFloat(editFormData.spot_rate);

    if (isNaN(homeValue) || isNaN(spotRate)) {
      setEditError('Please enter valid numbers');
      return;
    }

    if (homeValue <= 0 || spotRate <= 0) {
      setEditError('Invalid values entered');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/funding/movement/${movement.cash_movement_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_currency_code: editFormData.home_currency_code,
          home_currency_value: homeValue,
          trading_currency_code: editFormData.trading_currency_code,
          spot_rate: spotRate,
          direction_id: editFormData.direction_id,
          transaction_date: editFormData.transaction_date,
          period_from: editFormData.period_from || null,
          period_to: editFormData.period_to || null,
          notes: editFormData.notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setEditError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/funding/movement/${movement.cash_movement_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setEditError(err.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Auto-calculate trading currency value
  const calculateTradingValue = () => {
    const homeValue = parseFloat(editFormData.home_currency_value) || 0;
    const rate = parseFloat(editFormData.spot_rate) || 0;
    return (homeValue * rate).toFixed(4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {movement.direction.direction_code === 'IN' ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-400" />
              )}
              <h2 className="text-2xl font-bold text-white">{movement.direction.direction_name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-300 text-sm">
                {new Date(movement.transaction_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <GlassButton
              icon={Save}
              onClick={handleSaveEdit}
              disabled={isSaving}
              tooltip={isSaving ? 'Saving...' : 'Save Changes'}
              variant="primary"
              size="md"
            />
            <GlassButton
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
              tooltip="Delete Transaction"
              variant="secondary"
              size="md"
            />
            <GlassButton
              icon={X}
              onClick={handleCancelEdit}
              disabled={isSaving}
              tooltip="Cancel"
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

          <div className="space-y-4">
            {/* Direction */}
              <div>
              <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Type *</label>
                  <div className={isSaving ? 'opacity-50 pointer-events-none' : ''}>
                      <SegmentedControl
                      options={[
                          { value: 1, label: 'Deposit', icon: <TrendingUp className="w-5 h-5" /> },
                          { value: 2, label: 'Withdrawal', icon: <TrendingDown className="w-5 h-5" /> },
                      ]}
                      value={editFormData.direction_id}
                      onChange={(value) => setEditFormData({ ...editFormData, direction_id: value })}
                      />
                  </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Currency */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Transaction Currency *</label>
                <select
                  value={editFormData.home_currency_code}
                  onChange={(e) => setEditFormData({ ...editFormData, home_currency_code: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.home_currency_value}
                  onChange={(e) => setEditFormData({ ...editFormData, home_currency_value: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exchange Currency */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Exchange Currency *</label>
                <select
                  value={editFormData.trading_currency_code}
                  onChange={(e) => setEditFormData({ ...editFormData, trading_currency_code: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Exchange Rate */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Exchange Rate *</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editFormData.spot_rate}
                  onChange={(e) => setEditFormData({ ...editFormData, spot_rate: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Calculated Trading Value */}
            {editFormData.home_currency_value && editFormData.spot_rate && (
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
                <p className="text-blue-300 text-sm mb-2 font-medium">
                  Exchange Value (Calculated): {editFormData.trading_currency_code}
                </p>
                <p className="text-white text-2xl font-bold">{calculateTradingValue()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Period From */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Period From</label>
                <input
                  type="date"
                  value={editFormData.period_from}
                  onChange={(e) => setEditFormData({ ...editFormData, period_from: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>

              {/* Period To */}
              <div>
                <label className="text-blue-200 text-sm mb-2 block font-medium">Period To</label>
                <input
                  type="date"
                  value={editFormData.period_to}
                  onChange={(e) => setEditFormData({ ...editFormData, period_to: e.target.value })}
                  className="w-full funding-input rounded-xl px-4 py-3"
                  disabled={isSaving}
                />
              </div>
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Delete Transaction?</h3>
            <p className="text-blue-200 mb-6">
              Are you sure you want to delete this funding transaction? This action cannot be undone.
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
                onClick={handleDelete}
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