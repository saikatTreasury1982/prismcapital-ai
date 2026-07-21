'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { Plus, Save, RefreshCw } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import { createNews, updateNews } from '../../services/newsServiceClient';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';

interface NewsEntryFormProps {
  newsTypes: NewsType[];
  onSuccess: () => void;
  editingNews?: NewsListItem | null;
  onCancelEdit?: () => void;
}

export function NewsEntryForm({ newsTypes, onSuccess, editingNews, onCancelEdit }: NewsEntryFormProps) {
  const { data: session } = useSession();
  const [hasPosition, setHasPosition] = useState<boolean | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);

  const [formData, setFormData] = useState({
    ticker: '',
    exchange_id: 1,
    company_name: '',
    news_type_id: newsTypes[0]?.news_type_id || 1,
    news_description: '',
    news_date: '',
    alert_notes: '',
    news_source: '',
    news_url: '',
    tags: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const debouncedTicker = useDebounce(formData.ticker, 500);

  const getNewsTypeIcon = (typeCode: string) => {
    const icons: Record<string, string> = {
      'EARNINGS': '💰',
      'MARKET': '📈',
      'REGULATORY': '⚖️',
      'PRODUCT': '🚀'
    };
    return icons[typeCode] || '📰';
  };

  const handleCancel = () => {
    setFormData({
      ticker: '',
      exchange_id: 1,
      company_name: '',
      news_type_id: newsTypes[0]?.news_type_id || 1,
      news_description: '',
      news_date: new Date().toISOString().split('T')[0],
      alert_notes: '',
      news_source: '',
      news_url: '',
      tags: '',
    });
    setShowAlert(false);
    setError(null);
    setTickerError(null);
    setHasPosition(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = async () => {
    if (!formData.ticker || !formData.news_description) {
      setError('Ticker and Description are required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [];

      if (editingNews) {
        await updateNews(editingNews.news_id, {
          ticker: formData.ticker.toUpperCase(),
          exchange_id: formData.exchange_id,
          company_name: formData.company_name || undefined,
          news_type_id: formData.news_type_id,
          news_description: formData.news_description,
          news_date: formData.news_date,
          alert_date: showAlert ? formData.news_date : undefined,
          alert_notes: showAlert && formData.alert_notes ? formData.alert_notes : undefined,
          news_source: formData.news_source || undefined,
          news_url: formData.news_url || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined
        });
      } else {
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }
        await createNews(session.user.id, {
          ticker: formData.ticker.toUpperCase(),
          exchange_id: formData.exchange_id,
          company_name: formData.company_name || undefined,
          news_type_id: formData.news_type_id,
          news_description: formData.news_description,
          news_date: formData.news_date,
          alert_date: showAlert ? formData.news_date : undefined,
          alert_notes: showAlert && formData.alert_notes ? formData.alert_notes : undefined,
          news_source: formData.news_source || undefined,
          news_url: formData.news_url || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined
        });
      }

      setFormData({
        ticker: '',
        exchange_id: 1,
        company_name: '',
        news_type_id: newsTypes[0]?.news_type_id || 1,
        news_description: '',
        news_date: new Date().toISOString().split('T')[0],
        alert_notes: '',
        news_source: '',
        news_url: '',
        tags: '',
      });
      setShowAlert(false);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create news entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      news_date: new Date().toISOString().split('T')[0],
    }));
  }, []);

  useEffect(() => {
    if (editingNews) {
      const fetchFullNewsRecord = async () => {
        try {
          const response = await fetch(`/api/news?newsId=${editingNews.news_id}`);
          const result = await response.json();

          if (result.data) {
            const fullNews = result.data;
            setFormData({
              ticker: fullNews.ticker,
              exchange_id: fullNews.exchange_id,
              company_name: fullNews.company_name || '',
              news_type_id: fullNews.news_type_id,
              news_description: fullNews.news_description,
              news_date: fullNews.news_date,
              alert_notes: fullNews.alert_notes || '',
              news_source: fullNews.news_source || '',
              news_url: fullNews.news_url || '',
              tags: fullNews.tags
                ? (Array.isArray(fullNews.tags) ? fullNews.tags.join(', ') : fullNews.tags)
                : '',
            });
            setShowAlert(!!fullNews.alert_date);
          }
        } catch (err) {
          console.error('Failed to fetch full news record:', err);
        }
      };

      fetchFullNewsRecord();
    }
  }, [editingNews]);

  useEffect(() => {
    const fetchTickerData = async () => {
      if (!debouncedTicker) {
        setHasPosition(null);
        setTickerError(null);
        setFormData(prev => ({ ...prev, company_name: '' }));
        return;
      }

      setIsLoadingTicker(true);
      setTickerError(null);

      try {
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}&userId=${session?.user?.id}`);
        const posData = await posRes.json();

        setHasPosition(posData.hasPosition);

        if (posData.hasPosition && posData.tickerName) {
          setFormData(prev => ({ ...prev, company_name: posData.tickerName }));
          setTickerError(null);
        } else {
          const tickerRes = await fetch(`/api/ticker-lookup?ticker=${encodeURIComponent(debouncedTicker)}`);
          const tickerData = await tickerRes.json();

          if (tickerData.error) {
            setTickerError(tickerData.error);
            setFormData(prev => ({ ...prev, company_name: '' }));
          } else if (tickerData.name) {
            setFormData(prev => ({ ...prev, company_name: tickerData.name }));
            setTickerError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching ticker data:', err);
        setTickerError('Failed to lookup ticker');
        setFormData(prev => ({ ...prev, company_name: '' }));
        setHasPosition(null);
      } finally {
        setIsLoadingTicker(false);
      }
    };

    fetchTickerData();
  }, [debouncedTicker]);

  const labelCls = 'text-blue-200 text-sm font-medium';
  const inputCls = 'funding-input rounded-lg px-3 py-2 text-sm w-full';
  const groupTagCls = 'text-blue-300 text-[11px] mb-1 block font-medium';

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 sm:p-8 border border-white/20">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingNews ? 'Edit News Entry' : 'Quick News Entry'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">* Required fields</p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.ticker || !formData.news_description}
            tooltip={editingNews ? 'Update News Entry' : 'Save News Entry'}
            variant="primary"
            size="sm"
          />
          <GlassButton
            icon={RefreshCw}
            onClick={handleCancel}
            tooltip="Reset Form"
            variant="secondary"
            size="sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-md text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* ROW 1: Ticker + Ticker Name + indicator */}
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 items-center mb-5">
        <label className={labelCls}>Ticker <span className="text-rose-400">*</span></label>
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL"
            className={`funding-input rounded-lg px-3 py-2 text-sm w-28 flex-none uppercase ${tickerError ? 'border-2 border-rose-400' : ''}`}
          />
          <input
            type="text"
            value={formData.company_name}
            placeholder="Ticker name will appear here"
            className="funding-input rounded-lg px-3 py-2 text-sm flex-1 min-w-0 bg-white/5 cursor-not-allowed"
            disabled
          />
          {isLoadingTicker ? (
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center animate-pulse flex-none">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          ) : hasPosition !== null ? (
            <div className="relative group flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${hasPosition ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {hasPosition ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {hasPosition ? 'Open Position' : 'No Open Position'}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {tickerError && (
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 mb-3">
          <div />
          <p className="text-rose-400 text-sm">{tickerError}</p>
        </div>
      )}

      {/* ROW 2: Type (narrow) + Alert toggle, then Published, Source, URL */}
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 items-start mb-5">
        <div />
        <div className="grid gap-3 min-w-0" style={{ gridTemplateColumns: '1fr auto 0.9fr 1.1fr 1.1fr' }}>
          {/* Type of News */}
          <div className="min-w-0">
            <span className={groupTagCls}>Type of News <span className="text-rose-400">*</span></span>
            <select
              value={formData.news_type_id}
              onChange={(e) => setFormData({ ...formData, news_type_id: parseInt(e.target.value) })}
              className={inputCls}
            >
              {newsTypes.map(type => (
                <option key={type.news_type_id} value={type.news_type_id} className="bg-slate-800 text-white">
                  {getNewsTypeIcon(type.type_code)} {type.type_name}
                </option>
              ))}
            </select>
          </div>

          {/* Alert toggle */}
          <div className="flex flex-col">
            <span className={groupTagCls}>Alert</span>
            <label className="flex items-center cursor-pointer h-[38px]">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showAlert}
                  onChange={(e) => setShowAlert(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
          </div>

          {/* Published on */}
          <div className="min-w-0">
            <span className={groupTagCls}>Published on <span className="text-rose-400">*</span></span>
            <input
              type="date"
              value={formData.news_date}
              onChange={(e) => setFormData({ ...formData, news_date: e.target.value })}
              className={inputCls}
            />
          </div>

          {/* Source */}
          <div className="min-w-0">
            <span className={groupTagCls}>Source</span>
            <input
              type="text"
              value={formData.news_source}
              onChange={(e) => setFormData({ ...formData, news_source: e.target.value })}
              placeholder="Bloomberg, Reuters"
              className={inputCls}
            />
          </div>

          {/* URL */}
          <div className="min-w-0">
            <span className={groupTagCls}>URL</span>
            <input
              type="url"
              value={formData.news_url}
              onChange={(e) => setFormData({ ...formData, news_url: e.target.value })}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ROW 3: Description full-width */}
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 items-start">
        <label className={`${labelCls} pt-0.5`}>Description <span className="text-rose-400">*</span></label>
        <BulletTextarea
          value={formData.news_description}
          onChange={(value) => setFormData({ ...formData, news_description: value })}
          placeholder="Enter news details (each line becomes a bullet point)..."
          rows={3}
          label=""
          required
        />
      </div>
    </div>
  );
}