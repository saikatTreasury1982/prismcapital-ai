'use client';

import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Position, AssetClass, AssetType } from '../../lib/types/transaction';
import { getAssetClasses, getAssetTypes, getAssetClassification, saveAssetClassification } from '../../services/assetClassificationServiceClient';
import GlassButton from '@/app/lib/ui/GlassButton';
import { Save, XCircle, Sliders } from 'lucide-react';

interface AssignAttributesModalProps {
  position: Position | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignAttributesModal({ position, onClose, onSuccess }: AssignAttributesModalProps) {
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<Array<{ exchange_code: string; exchange_name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    exchange_id: '',
    class_id: '',
    type_id: ''
  });

  useEffect(() => {
    if (!position) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [classes, types, exchangesData] = await Promise.all([
          getAssetClasses(),
          getAssetTypes(),
          fetch('/api/exchanges').then(r => r.json())
        ]);

        setAssetClasses(classes);
        setAssetTypes(types);
        setExchanges(exchangesData.data || []);

        setFormData({ 
          exchange_id: '',
          class_id: '', 
          type_id: '' 
        });
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load options');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [position]);

  useEffect(() => {
    if (!position) return;

    const fetchAndFillClassification = async () => {
      try {
        const classification = await getAssetClassification(position.ticker);

        if (classification) {
          setFormData({
            exchange_id: classification.exchange_id ? String(classification.exchange_id) : '',
            class_id: classification.class_id ? String(classification.class_id) : '',
            type_id: classification.type_id ? String(classification.type_id) : ''
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch classification:', err);
      }
    };

    fetchAndFillClassification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.ticker]);

  const handleSave = async () => {
    if (!position) return;

    if (formData.class_id === '') {
      setError('Please select an Asset Class');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveAssetClassification({
        ticker: position.ticker,
        exchange_id: formData.exchange_id,
        class_id: formData.class_id,
        type_id: formData.type_id
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save classification:', err);
      setError(err.message || 'Failed to save attributes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!position) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Assign Attributes</h2>
              <p className="text-blue-200 text-sm mt-1">
                {position.ticker} {position.ticker_name && `- ${position.ticker_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-blue-200">Loading...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Exchange */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">
                    Exchange *
                  </label>
                  <select
                    value={formData.exchange_id}
                    onChange={(e) => setFormData({ ...formData, exchange_id: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  >
                    <option value="" className="bg-slate-800 text-white">
                      Select Exchange
                    </option>
                    {exchanges.map(exchange => (
                      <option 
                        key={exchange.exchange_code}
                        value={exchange.exchange_code}
                        className="bg-slate-800 text-white"
                      >
                        {exchange.exchange_code} - {exchange.exchange_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset Class */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">
                    Asset Class *
                  </label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  >
                    <option value={0} className="bg-slate-800 text-white">
                      Select Asset Class
                    </option>
                    {assetClasses.map(assetClass => (
                      <option 
                        key={assetClass.class_code}
                        value={assetClass.class_code}
                        className="bg-slate-800 text-white"
                      >
                        {assetClass.class_code} - {assetClass.class_name}
                      </option>
                    ))}
                  </select>
                  {assetClasses.find(c => c.class_code === formData.class_id)?.description && (
                    <p className="text-blue-300 text-xs mt-1">
                      {assetClasses.find(c => c.class_code === formData.class_id)?.description}
                    </p>
                  )}
                </div>

                {/* Asset Type */}
                <div>
                  <label className="text-blue-200 text-sm mb-2 block font-medium">
                    Asset Type *
                  </label>
                  <select
                    value={formData.type_id}
                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                    className="w-full funding-input rounded-xl px-4 py-3"
                    disabled={isSaving}
                  >
                    <option value="" className="bg-slate-800 text-white">
                      Select Asset Type
                    </option>
                    {assetTypes.map(assetType => (
                      <option 
                        key={assetType.type_code}
                        value={assetType.type_code}
                        className="bg-slate-800 text-white"
                      >
                        {assetType.type_code} - {assetType.type_name}
                      </option>
                    ))}
                  </select>
                  {assetTypes.find(t => t.type_code === formData.type_id)?.description && (
                    <p className="text-blue-300 text-xs mt-1">
                      {assetTypes.find(t => t.type_code === formData.type_id)?.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 justify-end">
                <GlassButton
                  icon={XCircle}
                  onClick={onClose}
                  disabled={isSaving}
                  tooltip="Cancel"
                  variant="secondary"
                  size="lg"
                />
                <GlassButton
                  icon={Save}
                  onClick={handleSave}
                  disabled={isSaving || formData.class_id === ''}
                  tooltip={isSaving ? 'Saving...' : 'Save Attributes'}
                  variant="primary"
                  size="lg"
                />
              </div>

              <div className="mt-3 text-center text-xs text-blue-300">
                * Required field
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}