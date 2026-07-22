'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Newspaper, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getIndices, getPositionNews, IndexQuote, PositionNewsItem } from '../../services/marketServiceClient';
import GlassButton from '@/app/lib/ui/GlassButton';

export function MarketStrip() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);

  const [news, setNews] = useState<PositionNewsItem[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsFetched, setNewsFetched] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [collapsedTickers, setCollapsedTickers] = useState<Set<string>>(new Set());

  const toggleTicker = (ticker: string) => {
    setCollapsedTickers(prev => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      return next;
    });
  };

  // Indices auto-load on mount
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

  // Indices auto-load on mount
  useEffect(() => {
    loadIndices();
  }, []);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Market Snapshot
        </h2>
        <GlassButton
          icon={RefreshCw}
          onClick={loadIndices}
          disabled={indicesLoading}
          tooltip="Refresh Indices"
          variant="secondary"
          size="sm"
        />
      </div>

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

      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-6" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          News for Your Positions
        </h2>
        <GlassButton
          icon={RefreshCw}
          onClick={handleRefreshNews}
          disabled={newsLoading}
          tooltip="Refresh News"
          variant="secondary"
          size="sm"
        />
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
        <div className="custom-scrollbar max-h-[400px] overflow-y-auto pr-1">
          {Object.entries(
            news.reduce<Record<string, typeof news>>((groups, item) => {
              (groups[item.ticker] ||= []).push(item);
              return groups;
            }, {})
          ).map(([ticker, items]) => {
            const isCollapsed = collapsedTickers.has(ticker);
            return (
            <div key={ticker} className="mb-4 last:mb-0">
              <button onClick={() => toggleTicker(ticker)} className="sticky top-0 z-10 w-full bg-slate-900/60 backdrop-blur-sm px-2 py-1.5 rounded-md mb-1 flex items-center justify-between hover:bg-slate-900/80 transition-all">
                <span className="text-blue-300 text-xs font-bold tracking-wide">
                  {ticker} · {items.length} {items.length === 1 ? 'headline' : 'headlines'}
                </span>
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-blue-300" /> : <ChevronUp className="w-3.5 h-3.5 text-blue-300" />}
              </button>
              {!isCollapsed && items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className={`flex items-start gap-3 py-3 border-t border-white/10 px-2 ${idx === items.length - 1 ? 'border-b' : ''
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm leading-snug">{item.headline}</p>
                    <p className="text-blue-300 text-[11px] mt-1">
                      {item.source} {'\u00B7'} {timeAgo(item.datetime)}
                    </p>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-none w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-blue-200 transition-all" title="Open article">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}