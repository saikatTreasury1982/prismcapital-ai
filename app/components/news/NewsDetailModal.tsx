'use client';

import { X } from 'lucide-react';
import { NewsListItem } from '../../lib/types/newsViews';

interface NewsDetailModalProps {
  news: NewsListItem | null;
  onClose: () => void;
}

export function NewsDetailModal({ news, onClose }: NewsDetailModalProps) {
  if (!news) return null;

  const getNewsTypeIcon = (typeCode: string) => {
    const icons: Record<string, string> = {
      'EARNINGS': '💰',
      'MARKET': '📈',
      'REGULATORY': '⚖️',
      'PRODUCT': '🚀'
    };
    return icons[typeCode] || '📰';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20">
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getNewsTypeIcon(news.news_type.type_code)}</span>
              <h2 className="text-2xl font-bold text-white">{news.ticker}</h2>
              {news.company_name && (
                <span className="text-blue-200">• {news.company_name}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm">
                {news.news_type.type_name}
              </span>
              <span className="text-blue-300 text-sm">
                {new Date(news.news_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
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
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-blue-200 mb-2">Description</h3>
            <p className="text-white leading-relaxed">{news.news_description}</p>
          </div>

          {/* Source & URL */}
          {(news.news_source || news.news_url) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.news_source && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">Source</h3>
                  <p className="text-white">{news.news_source}</p>
                </div>
              )}
              {news.news_url && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-200 mb-2">URL</h3>
                    <a href={news.news_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline break-all"
                    >
                    {news.news_url}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {news.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alert */}
          {news.alert_date && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl">
              <h3 className="text-sm font-semibold text-emerald-200 mb-2">Alert Set</h3>
              <div className="space-y-1">
                <p className="text-white">
                  <span className="text-emerald-300">Date:</span>{' '}
                  {new Date(news.alert_date).toLocaleDateString()}
                </p>
                {news.alert_notes && (
                  <p className="text-white">
                    <span className="text-emerald-300">Notes:</span> {news.alert_notes}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}