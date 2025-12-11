'use client';

import { useState, useEffect } from 'react';
import { deleteDividend } from '../../services/dividendServiceClient';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DividendSummaryByTicker, Dividend } from '../../lib/types/dividend';
import { DividendDetailModal } from './DividendDetailModal';
import { useSession } from 'next-auth/react';
import GlassButton from '@/app/lib/ui/GlassButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ByTickerViewProps {
  onEdit?: (dividend: Dividend) => void;
  onDelete?: () => void;
}

export function ByTickerView({ onEdit, onDelete }: ByTickerViewProps) {
  const { data: session } = useSession();
  const [summaries, setSummaries] = useState<DividendSummaryByTicker[]>([]);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [tickerDividends, setTickerDividends] = useState<Record<string, Dividend[]>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null);
  const [hasPosition, setHasPosition] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/dividends-by-ticker?userId=${session?.user?.id}`);
        const result = await res.json();
        setSummaries(result.data);

        // Check position for each ticker
        const positions: Record<string, boolean> = {};
        for (const summary of result.data) {
          const posRes = await fetch(`/api/hasOpenPosition?ticker=${encodeURIComponent(summary.ticker)}&userId=${session?.user?.id}`);
          const posData = await posRes.json();
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

    if (!tickerDividends[ticker]) {
      try {
        const page = currentPage[ticker] || 1;
        const res = await fetch(`/api/dividends-by-ticker?userId=${session?.user?.id}&ticker=${encodeURIComponent(ticker)}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;
        setTickerDividends(prev => ({ ...prev, [ticker]: data }));
        setTotalPages(prev => ({ ...prev, [ticker]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [ticker]: 1 }));
      } catch (error) {
        console.error('Error fetching dividends for ticker:', error);
      }
    }
  };

  const handlePageChange = async (ticker: string, newPage: number) => {
    try {
      const res = await fetch(`/api/dividends-by-ticker?userId=${session?.user?.id}&ticker=${encodeURIComponent(ticker)}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      setTickerDividends(prev => ({ ...prev, [ticker]: data }));
      setCurrentPage(prev => ({ ...prev, [ticker]: newPage }));
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
        <p className="text-blue-200 text-center">No dividends found. Start by adding some dividend entries!</p>
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
            <button
              onClick={() => handleTickerClick(summary.ticker)}
              className="w-full p-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{summary.ticker}</h3>
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
                <div className="text-emerald-300 font-bold text-lg">
                  ${summary.total_dividends_received.toFixed(2)}
                </div>
                <div className="text-blue-300">
                  {summary.total_dividend_payments} payments
                </div>
                <div className="text-purple-300">
                  Avg: ${summary.avg_dividend_per_share.toFixed(4)}/share
                </div>
                <div className="text-blue-200 text-xs">
                  Ex-Div: {new Date(summary.latest_ex_dividend_date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="text-blue-200 text-xs">
                  Payment: {summary.latest_payment_date 
                    ? new Date(summary.latest_payment_date).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : 'Not set'
                  }
                </div>
              </div>
            </button>

            {expandedTicker === summary.ticker && tickerDividends[summary.ticker] && (
              <div className="border-t border-white/20 p-4 bg-white/5">
                <div className="space-y-3">
                  {tickerDividends[summary.ticker].map((dividend) => (
                    <button
                      key={dividend.dividend_id}
                      onClick={() => setSelectedDividend(dividend)}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-blue-300 text-xs">
                            Ex: {new Date(dividend.ex_dividend_date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="text-blue-200 text-xs">
                            Pay: {dividend.payment_date 
                              ? new Date(dividend.payment_date).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : 'Not set'
                            }
                          </span>
                        </div>
                        <span className="text-emerald-300 font-bold">
                          ${(dividend.dividend_per_share * dividend.shares_owned).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-white text-sm">
                        ${dividend.dividend_per_share.toFixed(4)}/share × {dividend.shares_owned.toLocaleString()} shares
                      </div>
                    </button>
                  ))}
                </div>

                {totalPages[summary.ticker] > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <GlassButton
                      icon={ChevronLeft}
                      onClick={() => handlePageChange(summary.ticker, (currentPage[summary.ticker] || 1) - 1)}
                      disabled={(currentPage[summary.ticker] || 1) === 1}
                      tooltip="Previous Page"
                      variant="primary"
                      size="sm"
                    />
                    <span className="text-white text-sm">
                      Page {currentPage[summary.ticker] || 1} of {totalPages[summary.ticker]}
                    </span>
                    <GlassButton
                      icon={ChevronRight}
                      onClick={() => handlePageChange(summary.ticker, (currentPage[summary.ticker] || 1) + 1)}
                      disabled={(currentPage[summary.ticker] || 1) >= totalPages[summary.ticker]}
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

      <DividendDetailModal 
        dividend={selectedDividend} 
        onClose={() => setSelectedDividend(null)}
        onEdit={(dividend) => {
          if (onEdit) {
            onEdit(dividend);
          }
          setSelectedDividend(null);
        }}
        onDelete={async (dividendId) => {
          await deleteDividend(dividendId);
          setSelectedDividend(null);
          if (onDelete) {
            onDelete();
          }
        }}
      />
    </>
  );
}