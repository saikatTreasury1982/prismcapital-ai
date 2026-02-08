'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { Plus } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { NewsListItem } from '../../lib/types/newsViews';
import { createNews, updateNews } from '../../services/newsServiceClient';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { BulletTextarea } from '@/app/lib/ui/BulletTextarea';
import { Save, XCircle } from 'lucide-react';

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

  // Get icon for news type
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
    // Validation
    if (!formData.ticker || !formData.news_description) {
      setError('Ticker and Description are required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      
      if (editingNews) {
        // Update existing news
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
        // Create new news
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

      // Reset form
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

  // Pre-fill form when editing
  // Pre-fill form when editing - fetch full news record
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

  // Fetch ticker name and position when user stops typing
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
        // Step 1: Check positions table first
        const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}&userId=${session?.user?.id}`);
        const posData = await posRes.json();
        
        setHasPosition(posData.hasPosition);

        // Step 2: Use ticker_name from positions if available
        if (posData.hasPosition && posData.tickerName) {
          setFormData(prev => ({ ...prev, company_name: posData.tickerName }));
          setTickerError(null);
        } else {
          // Step 3: Fallback to AlphaVantage only if ticker not in positions
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

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6" />
            {editingNews ? 'Edit News Entry' : 'Quick News Entry'}
          </h2>
          <p className="text-xs text-blue-300 mt-1">* Required fields</p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            icon={XCircle}
            onClick={handleCancel}
            tooltip="Clear Form"
            variant="secondary"
            size="md"
          />
          <GlassButton
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.ticker || !formData.news_description}
            tooltip={editingNews ? 'Update News Entry' : 'Save News Entry'}
            variant="primary"
            size="md"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ticker */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker <span className="text-rose-400">*</span></label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value.toUpperCase() })
              }
              placeholder="AAPL"
              className={`flex-1 funding-input rounded-xl px-4 py-3 uppercase max-w-[70%] ${
                tickerError ? 'border-2 border-rose-400' : ''
              }`}
              required
            />
            {isLoadingTicker ? (
              <span className="px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap bg-blue-600 text-white">
                Loading...
              </span>
            ) : hasPosition !== null ? (
              <span
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  hasPosition ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}
              >
                {hasPosition ? 'Open Position' : 'No Position'}
              </span>
            ) : null}
          </div>
          {tickerError && (
            <p className="text-rose-400 text-sm mt-2">{tickerError}</p>
          )}
        </div>


        {/* Ticker Name */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker Name</label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            placeholder="Apple Inc."
            className="w-full funding-input rounded-xl px-4 py-3"
            disabled
          />
        </div>

        {/* News Type */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Type of News <span className="text-rose-400">*</span></label>
          <select
            value={formData.news_type_id}
            onChange={(e) => setFormData({...formData, news_type_id: parseInt(e.target.value)})}
            className="w-full funding-input rounded-xl px-4 py-3"
          >
            {newsTypes.map(type => (
              <option key={type.news_type_id} value={type.news_type_id} className="bg-slate-800 text-white">
                {getNewsTypeIcon(type.type_code)} {type.type_name}
              </option>
            ))}
          </select>
        </div>

        {/* News Date */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">News published on <span className="text-rose-400">*</span></label>
          <input
            type="date"
            value={formData.news_date}
            onChange={(e) => setFormData({...formData, news_date: e.target.value})}
            className="w-full funding-input rounded-xl px-4 py-3"
            required
          />
        </div>

        {/* News Source */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Source</label>
          <input
            type="text"
            value={formData.news_source}
            onChange={(e) => setFormData({...formData, news_source: e.target.value})}
            placeholder="Bloomberg, Reuters, etc."
            className="w-full funding-input rounded-xl px-4 py-3"
          />
        </div>

        {/* News URL */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">URL</label>
          <input
            type="url"
            value={formData.news_url}
            onChange={(e) => setFormData({...formData, news_url: e.target.value})}
            placeholder="https://..."
            className="w-full funding-input rounded-xl px-4 py-3"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <BulletTextarea
            value={formData.news_description}
            onChange={(value) => setFormData({...formData, news_description: value})}
            placeholder="Enter news details (each line becomes a bullet point)..."
            rows={4}
            label="Description of the News"
            required
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className="text-blue-200 text-sm mb-2 block font-medium">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            placeholder="quarterly, revenue, guidance"
            className="w-full funding-input rounded-xl px-4 py-3"
          />
        </div>

        {/* Alert Toggle */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showAlert}
                onChange={(e) => setShowAlert(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </div>
            <span className="text-blue-200 font-medium">Set Alert for this news</span>
          </label>
        </div>

        {/* Alert Fields (conditional) */}
        {showAlert && (
            <div className="md:col-span-2">
              <BulletTextarea
                value={formData.alert_notes}
                onChange={(value) => setFormData({...formData, alert_notes: value})}
                placeholder="Reminder notes (each line becomes a bullet point)..."
                rows={3}
                label="Alert Notes"
                className="border-emerald-400/30"
              />
            </div>
        )}
      </div>
    </div>
  );
}