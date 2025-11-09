'use client';

import { useState, useEffect } from 'react';
import { deleteNews } from '../../services/newsServiceClient';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NewsSummaryByTicker, NewsListItem } from '../../lib/types/newsViews';
import { NewsDetailModal } from './NewsDetailModal';
import { useSession } from 'next-auth/react';

interface ByTickerViewProps {
  onEdit?: (news: NewsListItem) => void;
  onDelete?: () => void;
}

export function ByTickerView({ onEdit, onDelete }: ByTickerViewProps) {
  const { data: session } = useSession();
  const [summaries, setSummaries] = useState<NewsSummaryByTicker[]>([]);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerNews, setTickerNews] = useState<Record<string, NewsListItem[]>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsListItem | null>(null);
  const [hasPosition, setHasPosition] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/news-by-ticker?userId=${session?.user?.id}`);
        const result = await res.json();
        setSummaries(result.data);

        // Check position for each ticker
        const positions: Record<string, boolean> = {};
        for (const summary of result.data) {
          const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(summary.ticker)}&userId=${session?.user?.id}`);
          const posData = await res.json();
          positions[summary.ticker] = posData.hasPosition;
        }
        setHasPosition(positions);
      } catch (error) {
        console.error('Error fetching ticker summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const handleTickerClick = async (ticker: string) => {
    if (expandedTicker === ticker) {
      setExpandedTicker(null);
      return;
    }

    setExpandedTicker(ticker);

    if (!tickerNews[ticker]) {
      try {
        const page = currentPage[ticker] || 1;
        const res = await fetch(`/api/news-by-ticker?userId=${session?.user?.id}&ticker=${encodeURIComponent(ticker)}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;

        setTickerNews(prev => ({ ...prev, [ticker]: data }));
        setTotalPages(prev => ({ ...prev, [ticker]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [ticker]: 1 }));
      } catch (error) {
        console.error('Error fetching news for ticker:', error);
      }
    }
  };

  const handlePageChange = async (ticker: string, newPage: number) => {
    try {
      const res = await fetch(`/api/news-by-ticker?userId=${session?.user?.id}&ticker=${encodeURIComponent(ticker)}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      
      setTickerNews(prev => ({ ...prev, [ticker]: data }));
      setCurrentPage(prev => ({ ...prev, [ticker]: newPage }));
    } catch (error) {
      console.error('Error fetching page:', error);
    }
  };

  const getNewsTypeIcon = (typeCode: string) => {
    const icons: Record<string, string> = {
      'EARNINGS': '💰',
      'MARKET': '📈',
      'REGULATORY': '⚖️',
      'PRODUCT': '🚀'
    };
    return icons[typeCode] || '📰';
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">Loading...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">No news found. Start by adding some news entries!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
        {summaries.map((summary) => (
          <div
            key={summary.ticker}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex flex-col h-fit"
          >
            {/* Card Header */}
            <button
              onClick={() => handleTickerClick(summary.ticker)}
              className="w-full p-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{summary.ticker}</h3>
                  {summary.company_name && (
                    <p className="text-blue-200 text-sm line-clamp-1">{summary.company_name}</p>
                  )}
                </div>
                {expandedTicker === summary.ticker ? (
                  <ChevronUp className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                )}
              </div>
              
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-3 ${
                  hasPosition[summary.ticker]
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-white'
                }`}
              >
                {hasPosition[summary.ticker] ? 'Open Position' : 'No Position'}
              </span>

              <div className="space-y-1 text-sm">
                <div className="text-blue-300">
                  Total: {summary.total_news_items}
                </div>
                {summary.earnings_count > 0 && (
                  <div className="text-emerald-300">
                    💰 Earnings: {summary.earnings_count}
                  </div>
                )}
                {summary.other_news_count > 0 && (
                  <div className="text-purple-300">
                    📰 Other: {summary.other_news_count}
                  </div>
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedTicker === summary.ticker && tickerNews[summary.ticker] && (
              <div className="border-t border-white/20 p-4 bg-white/5">
                <div className="space-y-3">
                  {tickerNews[summary.ticker].map((news) => (
                    <button
                      key={news.news_id}
                      onClick={() => setSelectedNews(news)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getNewsTypeIcon(news.news_type.type_code)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-300 text-sm">
                              {new Date(news.news_date).toLocaleDateString()}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded text-xs">
                              {news.news_type.type_name}
                            </span>
                          </div>
                          <p className="text-white line-clamp-2">{news.news_description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages[summary.ticker] > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => handlePageChange(summary.ticker, (currentPage[summary.ticker] || 1) - 1)}
                      disabled={(currentPage[summary.ticker] || 1) === 1}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-white">
                      Page {currentPage[summary.ticker] || 1} of {totalPages[summary.ticker]}
                    </span>
                    <button
                      onClick={() => handlePageChange(summary.ticker, (currentPage[summary.ticker] || 1) + 1)}
                      disabled={(currentPage[summary.ticker] || 1) >= totalPages[summary.ticker]}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <NewsDetailModal 
        news={selectedNews} 
        onClose={() => setSelectedNews(null)}
        onEdit={(news) => {
          if (onEdit) {
            onEdit(news);
          }
          setSelectedNews(null);
        }}
        onDelete={async (newsId) => {
          await deleteNews(newsId);
          setSelectedNews(null);
          if (onDelete) {
            onDelete();
          }
        }}
      />
    </>
  );
}