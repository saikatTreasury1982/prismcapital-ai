'use client';

import { useState, useEffect } from 'react';
import { deleteNews } from '../../services/newsServiceClient';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NewsSummaryByType, NewsListItem } from '../../lib/types/newsViews';
import { NewsDetailModal } from './NewsDetailModal';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BulletDisplay } from '@/app/lib/ui/BulletTextarea';
import { NewsType } from '../../lib/types/news';

interface ByCategoryViewProps {
  newsTypes: NewsType[];
  onEdit?: (news: NewsListItem) => void;
  onDelete?: () => void;
}

export function ByCategoryView({ newsTypes, onEdit, onDelete }: ByCategoryViewProps) {
  const { data: session } = useSession();
  const [summaries, setSummaries] = useState<NewsSummaryByType[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
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
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/news-by-type?userId=${session?.user?.id}`);
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
  }, [session?.user?.id]);

  const handleTypeClick = async (typeName: string) => {
    // Toggle expansion
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeName)) {
        newSet.delete(typeName);
      } else {
        newSet.add(typeName);
      }
      return newSet;
    });

    // Fetch data if not already loaded
    if (!typeNews[typeName]) {
      try {
        const page = currentPage[typeName] || 1;
        const res = await fetch(`/api/news-by-type?userId=${session?.user?.id}&typeName=${encodeURIComponent(typeName)}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;
        
        // Get unique tickers
        const uniqueTickers = [...new Set(data.map((n: NewsListItem) => n.ticker))];
        
        // Fetch ALL positions in PARALLEL before displaying news
        const positionPromises = uniqueTickers.map(ticker =>
          fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker as string)}&userId=${session?.user?.id}`)
            .then(res => res.json())
            .then(posData => ({ ticker: ticker as string, hasPosition: posData.hasPosition }))
        );
        
        const positionResults = await Promise.all(positionPromises);
        const positions: Record<string, boolean> = {};
        positionResults.forEach(({ ticker, hasPosition }) => {
          positions[ticker] = hasPosition;
        });
        
        // Now set everything together - news will display with correct positions
        setHasPosition(prev => ({ ...prev, ...positions }));
        setTypeNews(prev => ({ ...prev, [typeName]: data }));
        setTotalPages(prev => ({ ...prev, [typeName]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [typeName]: 1 }));
        
      } catch (error) {
        console.error('Error fetching news for type:', error);
      }
    }
  };

  const handlePageChange = async (typeName: string, newPage: number) => {
    try {
      const res = await fetch(`/api/news-by-type?userId=${session?.user?.id}&typeName=${encodeURIComponent(typeName)}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      setTypeNews(prev => ({ ...prev, [typeName]: data }));
      setCurrentPage(prev => ({ ...prev, [typeName]: newPage }));

      // Update positions for new tickers
      const positions: Record<string, boolean> = {};
      const uniqueTickers = [...new Set(data.map((n: NewsListItem) => n.ticker))];
      for (const ticker of uniqueTickers) {
        if (!(ticker as string in hasPosition)) {
          const res = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(ticker as string)}&userId=${session?.user?.id}`);
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
                {expandedTypes.has(summary.type_name) ? (
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
            {expandedTypes.has(summary.type_name) && typeNews[summary.type_name] && (
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
                                {new Date(news.news_date).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                            </span>
                          </div>
                          <div className="line-clamp-2">
                            <BulletDisplay text={news.news_description} className="text-sm" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages[summary.type_name] > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <GlassButton
                      icon={ChevronLeft}
                      onClick={() => handlePageChange(summary.type_name, (currentPage[summary.type_name] || 1) - 1)}
                      disabled={(currentPage[summary.type_name] || 1) === 1}
                      tooltip="Previous Page"
                      variant="primary"
                      size="sm"
                    />
                    <span className="text-white text-sm">
                      Page {currentPage[summary.type_name] || 1} of {totalPages[summary.type_name]}
                    </span>
                    <GlassButton
                      icon={ChevronRight}
                      onClick={() => handlePageChange(summary.type_name, (currentPage[summary.type_name] || 1) + 1)}
                      disabled={(currentPage[summary.type_name] || 1) >= totalPages[summary.type_name]}
                      tooltip="Next Page"
                      variant="primary"
                      size="sm"
                    />
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
        newsTypes={newsTypes}
        onEdit={(news) => {
          if (onEdit) {
            onEdit(news);
          }
          setSelectedNews(null);
          if (onDelete) {
            onDelete();
          }
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