'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { Plus } from 'lucide-react';
import { NewsType } from '../../lib/types/news';
import { createNews, hasOpenPositionClient } from '../../services/newsServiceClient';
import { CURRENT_USER_ID } from '../../lib/auth';

interface NewsEntryFormProps {
  newsTypes: NewsType[];
  onSuccess: () => void;
}

export function NewsEntryForm({ newsTypes, onSuccess }: NewsEntryFormProps) {

  const [hasPosition, setHasPosition] = useState<boolean | null>(null);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [isLoadingTicker, setIsLoadingTicker] = useState(false);
    
  const [formData, setFormData] = useState({
    ticker: '',
    exchange_id: 1, // Default to first exchange
    company_name: '',
    news_type_id: newsTypes[0]?.news_type_id || 1,
    news_description: '',
    news_date: '',
    alert_date: '',
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
      
      await createNews(CURRENT_USER_ID, {
        ticker: formData.ticker.toUpperCase(),
        exchange_id: formData.exchange_id,
        company_name: formData.company_name || undefined,
        news_type_id: formData.news_type_id,
        news_description: formData.news_description,
        news_date: formData.news_date,
        alert_date: showAlert && formData.alert_date ? formData.alert_date : undefined,
        alert_notes: showAlert && formData.alert_notes ? formData.alert_notes : undefined,
        news_source: formData.news_source || undefined,
        news_url: formData.news_url || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      });

      // Reset form
      setFormData({
        ticker: '',
        exchange_id: 1,
        company_name: '',
        news_type_id: newsTypes[0]?.news_type_id || 1,
        news_description: '',
        news_date: new Date().toISOString().split('T')[0],
        alert_date: '',
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
        // Fetch ticker name from AlphaVantage
        const tickerRes = await fetch(`/api/ticker-lookup?ticker=${encodeURIComponent(debouncedTicker)}`);
        const tickerData = await tickerRes.json();

        if (tickerData.error) {
          setTickerError(tickerData.error);
          setFormData(prev => ({ ...prev, company_name: '' }));
          setHasPosition(null);
        } else if (tickerData.name) {
          setFormData(prev => ({ ...prev, company_name: tickerData.name }));
          setTickerError(null);

          // Fetch position status
          const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(debouncedTicker)}&userId=${CURRENT_USER_ID}`);
          const posData = await posRes.json();
          setHasPosition(posData.hasPosition);
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
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Plus className="w-6 h-6" />
        Quick News Entry
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-lg text-rose-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ticker */}
        <div>
          <label className="text-blue-200 text-sm mb-2 block font-medium">Ticker *</label>
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
          <label className="text-blue-200 text-sm mb-2 block font-medium">Type of News *</label>
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
          <label className="text-blue-200 text-sm mb-2 block font-medium">News published on *</label>
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
          <label className="text-blue-200 text-sm mb-2 block font-medium">Description of the News *</label>
          <textarea
            value={formData.news_description}
            onChange={(e) => setFormData({...formData, news_description: e.target.value})}
            placeholder="Enter news details..."
            rows={4}
            className="w-full funding-input rounded-xl px-4 py-3 resize-none"
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
            <input
              type="checkbox"
              checked={showAlert}
              onChange={(e) => setShowAlert(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-blue-200 font-medium">Set Alert for this news</span>
          </label>
        </div>

        {/* Alert Fields (conditional) */}
        {showAlert && (
          <>
            <div>
              <label className="text-emerald-200 text-sm mb-2 block font-medium">Alert Date</label>
              <input
                type="date"
                value={formData.alert_date}
                onChange={(e) => setFormData({...formData, alert_date: e.target.value})}
                className="w-full funding-input rounded-xl px-4 py-3 border-emerald-400/30"
              />
            </div>
            <div>
              <label className="text-emerald-200 text-sm mb-2 block font-medium">Alert Notes</label>
              <input
                type="text"
                value={formData.alert_notes}
                onChange={(e) => setFormData({...formData, alert_notes: e.target.value})}
                placeholder="Reminder notes..."
                className="w-full funding-input rounded-xl px-4 py-3 border-emerald-400/30"
              />
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !formData.ticker || !formData.news_description}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save News Entry'}
      </button>

      <div className="mt-3 text-center text-xs text-blue-300">
        * Required fields
      </div>
    </div>
  );
}