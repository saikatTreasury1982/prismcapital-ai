'use client';

import { useState, useEffect } from 'react';
import { deleteNews } from '../../services/newsServiceClient';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NewsSummaryByType, NewsListItem } from '../../lib/types/newsViews';
import { NewsDetailModal } from './NewsDetailModal';
import { CURRENT_USER_ID } from '../../lib/auth';

interface ByCategoryViewProps {
  onEdit?: (news: NewsListItem) => void;
  onDelete?: () => void;
}

export function ByCategoryView({ onEdit, onDelete }: ByCategoryViewProps) {
  const [summaries, setSummaries] = useState<NewsSummaryByType[]>([]);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [typeNews, setTypeNews] = useState<Record<string, NewsListItem[]>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsListItem | null>(null);
  const [hasPosition, setHasPosition] = useState<Record<string, boolean>>({});

  const getNewsTypeIcon = (typeName: string) => {
    const icons: Record<string, string> = {
      'Earnings': '💰',
      'Market News': '📈',
      'Regulatory': '⚖️',
      'Product Launch': '🚀'
    };
    return icons[typeName] || '📰';
  };

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/news-by-type?userId=${CURRENT_USER_ID}`);
        const result = await res.json();
        const data = result.data;
        setSummaries(data);
      } catch (error) {
        console.error('Error fetching type summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const handleTypeClick = async (typeName: string) => {
    if (expandedType === typeName) {
      setExpandedType(null);
      return;
    }

    setExpandedType(typeName);

    if (!typeNews[typeName]) {
      try {
        const page = currentPage[typeName] || 1;
        const res = await fetch(`/api/news-by-type?userId=${CURRENT_USER_ID}&typeName=${encodeURIComponent(typeName)}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;
        setTypeNews(prev => ({ ...prev, [typeName]: data }));
        setTotalPages(prev => ({ ...prev, [typeName]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [typeName]: 1 }));

        // Check positions for each ticker in the news
        const positions: Record<string, boolean> = {};
        const uniqueTickers = [...new Set(data.map((n: NewsListItem) => n.ticker))];
        for (const ticker of uniqueTickers) {
          const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker as string)}&userId=${CURRENT_USER_ID}`);
          const posData = await res.json();
          positions[ticker as string] = posData.hasPosition;
        }
        setHasPosition(prev => ({ ...prev, ...positions }));
      } catch (error) {
        console.error('Error fetching news for type:', error);
      }
    }
  };

  const handlePageChange = async (typeName: string, newPage: number) => {
    try {
      const res = await fetch(`/api/news-by-type?userId=${CURRENT_USER_ID}&typeName=${encodeURIComponent(typeName)}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      setTypeNews(prev => ({ ...prev, [typeName]: data }));
      setCurrentPage(prev => ({ ...prev, [typeName]: newPage }));

      // Update positions for new tickers
      const positions: Record<string, boolean> = {};
      const uniqueTickers = [...new Set(data.map((n: NewsListItem) => n.ticker))];
      for (const ticker of uniqueTickers) {
        if (!(ticker as string in hasPosition)) {
          const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker as string)}&userId=${CURRENT_USER_ID}`);
          const posData = await res.json();
          positions[ticker as string] = posData.hasPosition;
        }
      }
      if (Object.keys(positions).length > 0) {
        setHasPosition(prev => ({ ...prev, ...positions }));
      }
    } catch (error) {
      console.error('Error fetching page:', error);
    }
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
            key={summary.type_name}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex flex-col h-fit"
          >
            {/* Card Header */}
            <button
              onClick={() => handleTypeClick(summary.type_name)}
              className="w-full p-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{getNewsTypeIcon(summary.type_name)}</span>
                  <h3 className="text-xl font-bold text-white">{summary.type_name}</h3>
                </div>
                {expandedType === summary.type_name ? (
                  <ChevronUp className="w-5 h-5 text-white flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white flex-shrink-0" />
                )}
              </div>

              <div className="space-y-1 text-sm">
                <div className="text-blue-300">
                  {summary.total_news_items} news items
                </div>
                <div className="text-purple-300">
                  {summary.unique_tickers} unique tickers
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedType === summary.type_name && typeNews[summary.type_name] && (
              <div className="border-t border-white/20 p-4 bg-white/5">
                <div className="space-y-3">
                  {typeNews[summary.type_name].map((news) => (
                    <button
                      key={news.news_id}
                      onClick={() => setSelectedNews(news)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-white">{news.ticker}</span>
                            {news.company_name && (
                              <span className="text-blue-200 text-sm">{news.company_name}</span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                hasPosition[news.ticker]
                                  ? 'bg-green-600 text-white'
                                  : 'bg-yellow-600 text-white'
                              }`}
                            >
                              {hasPosition[news.ticker] ? 'Open' : 'No Position'}
                            </span>
                            <span className="text-blue-300 text-sm ml-auto">
                              {new Date(news.news_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white line-clamp-2">{news.news_description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages[summary.type_name] > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => handlePageChange(summary.type_name, (currentPage[summary.type_name] || 1) - 1)}
                      disabled={(currentPage[summary.type_name] || 1) === 1}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-white">
                      Page {currentPage[summary.type_name] || 1} of {totalPages[summary.type_name]}
                    </span>
                    <button
                      onClick={() => handlePageChange(summary.type_name, (currentPage[summary.type_name] || 1) + 1)}
                      disabled={(currentPage[summary.type_name] || 1) >= totalPages[summary.type_name]}
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