'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Newspaper, RefreshCw, X, ExternalLink } from 'lucide-react';
import { getIndices, getPositionNews, IndexQuote, PositionNewsItem } from '../../services/marketServiceClient';

export function MarketStrip() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  const [news, setNews] = useState<PositionNewsItem[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFetched, setNewsFetched] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<PositionNewsItem | null>(null);

  // Indices auto-load on mount
  useEffect(() => {
    const loadIndices = async () => {
      setIndicesLoading(true);
      try {
        const data = await getIndices();
        setIndices(data);
      } catch (err) {
        console.error('Failed to load indices:', err);
      } finally {
        setIndicesLoading(false);
      }
    };
    loadIndices();
  }, []);

  // News only loads on refresh click
  const handleRefreshNews = async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const result = await getPositionNews();
      setNews(result.data);
      setTickers(result.tickers);
      setNewsFetched(true);
    } catch (err: any) {
      setNewsError(err.message || 'Failed to load news');
    } finally {
      setNewsLoading(false);
    }
  };

  const formatChange = (change: number | null, pct: number | null) => {
    if (change === null || pct === null) return '\u2014';
    const sign = change >= 0 ? '+' : '\u2212';
    return `${sign}${Math.abs(change).toFixed(2)} (${sign}${Math.abs(pct).toFixed(2)}%)`;
  };

  const timeAgo = (unixSeconds: number) => {
    const diff = Date.now() - unixSeconds * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 sm:p-8 border border-white/20">
      {/* Indices */}
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5" />
        Market Snapshot
      </h2>

      {indicesLoading ? (
        <p className="text-blue-200 text-sm py-4">Loading indices...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {indices.map((idx) => {
            const up = (idx.change ?? 0) >= 0;
            return (
              <div key={idx.symbol} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-blue-300 text-xs mb-1">{idx.name}</p>
                <p className="text-white text-xl font-bold">
                  {idx.price !== null
                    ? idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '\u2014'}
                </p>
                <p className={`text-xs font-semibold mt-1 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {up ? '\u25B2' : '\u25BC'} {formatChange(idx.change, idx.changePercent)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-6" />

      {/* News */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          News for Your Positions
        </h2>
        <button
          onClick={handleRefreshNews}
          disabled={newsLoading}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-blue-200 transition-all disabled:opacity-50"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {newsError && (
        <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-md text-rose-200 text-sm mb-3">
          {newsError}
        </div>
      )}

      {newsLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
          <span className="text-blue-200 text-sm">Fetching news for your positions...</span>
        </div>
      ) : !newsFetched ? (
        <div className="text-center py-10">
          <Newspaper className="w-8 h-8 text-blue-400/50 mx-auto mb-2" />
          <p className="text-blue-200 text-sm">Click refresh to load news for your open positions</p>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-blue-200 text-sm">
            {tickers.length === 0
              ? 'No open positions to fetch news for'
              : 'No recent news found for your positions'}
          </p>
        </div>
      ) : (
        <div>
          {news.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => setSelectedItem(item)}
              className={`flex items-start gap-3 py-3 border-t border-white/10 cursor-pointer hover:bg-white/5 transition-all px-2 ${
                idx === news.length - 1 ? 'border-b' : ''
              }`}
            >
              <span className="flex-none bg-blue-500/20 text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded mt-0.5">
                {item.ticker}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm leading-snug">{item.headline}</p>
                <p className="text-blue-300 text-[11px] mt-1">
                  {item.source} {'\u00B7'} {timeAgo(item.datetime)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Headline detail popover/modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-1 rounded">
                {selectedItem.ticker}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-white text-lg font-bold leading-snug mb-2">{selectedItem.headline}</h3>
            <p className="text-blue-300 text-xs mb-4">
              {selectedItem.source} {'\u00B7'} {timeAgo(selectedItem.datetime)}
            </p>

            {selectedItem.image && (
              <img
                src={selectedItem.image}
                alt=""
                className="w-full rounded-lg mb-4 max-h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {selectedItem.summary && (
              <p className="text-blue-100 text-sm leading-relaxed mb-4">{selectedItem.summary}</p>
            )}

            {selectedItem.url && (
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 hover:bg-blue-500/30 transition-all text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Read full article
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
