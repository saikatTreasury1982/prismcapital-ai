'use client';

import { useState, useEffect } from 'react';
import { deleteDividend } from '../../services/dividendServiceClient';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { DividendSummaryByYear, Dividend } from '../../lib/types/dividend';
import { DividendDetailModal } from './DividendDetailModal';
import { CURRENT_USER_ID } from '../../lib/auth';

interface ByYearViewProps {
  onEdit?: (dividend: Dividend) => void;
  onDelete?: () => void;
}

export function ByYearView({ onEdit, onDelete }: ByYearViewProps) {
  const [summaries, setSummaries] = useState<DividendSummaryByYear[]>([]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [yearDividends, setYearDividends] = useState<Record<number, Dividend[]>>({});
  const [currentPage, setCurrentPage] = useState<Record<number, number>>({});
  const [totalPages, setTotalPages] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/dividends-by-year?userId=${CURRENT_USER_ID}`);
        const result = await res.json();
        setSummaries(result.data);
      } catch (error) {
        console.error('Error fetching year summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const calculateGrowth = (currentYear: number) => {
    const currentIndex = summaries.findIndex(s => s.year === currentYear);
    if (currentIndex === -1 || currentIndex === summaries.length - 1) return null;
    
    const current = summaries[currentIndex];
    const previous = summaries[currentIndex + 1];
    
    if (previous.total_dividends_received === 0) return null;
    
    const growth = ((current.total_dividends_received - previous.total_dividends_received) / previous.total_dividends_received) * 100;
    return growth;
  };

  const handleYearClick = async (year: number) => {
    if (expandedYear === year) {
      setExpandedYear(null);
      return;
    }

    setExpandedYear(year);

    if (!yearDividends[year]) {
      try {
        const page = currentPage[year] || 1;
        const res = await fetch(`/api/dividends-by-year?userId=${CURRENT_USER_ID}&year=${year}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;
        setYearDividends(prev => ({ ...prev, [year]: data }));
        setTotalPages(prev => ({ ...prev, [year]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [year]: 1 }));
      } catch (error) {
        console.error('Error fetching dividends for year:', error);
      }
    }
  };

  const handlePageChange = async (year: number, newPage: number) => {
    try {
      const res = await fetch(`/api/dividends-by-year?userId=${CURRENT_USER_ID}&year=${year}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      setYearDividends(prev => ({ ...prev, [year]: data }));
      setCurrentPage(prev => ({ ...prev, [year]: newPage }));
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

  if (!summaries || summaries.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
        <p className="text-blue-200 text-center">No dividends found. Start by adding some dividend entries!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
        {summaries.map((summary) => {
          const growth = calculateGrowth(summary.year);
          
          return (
            <div
              key={summary.year}
              className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex flex-col h-fit"
            >
              <button
                onClick={() => handleYearClick(summary.year)}
                className="w-full p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">{summary.year}</h3>
                  </div>
                  {expandedYear === summary.year ? (
                    <ChevronUp className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="text-emerald-300 font-bold text-2xl">
                    ${summary.total_dividends_received.toFixed(2)}
                  </div>
                  {growth !== null && (
                    <div className={`flex items-center gap-1 ${growth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{Math.abs(growth).toFixed(1)}% vs prev year</span>
                    </div>
                  )}
                  <div className="text-blue-300">
                    {summary.total_dividend_payments} payments
                  </div>
                  <div className="text-purple-300">
                    {summary.stocks_paid_dividends} stocks
                  </div>
                </div>
              </button>

              {expandedYear === summary.year && yearDividends[summary.year] && (
                <div className="border-t border-white/20 p-4 bg-white/5">
                  <div className="space-y-3">
                    {yearDividends[summary.year].map((dividend) => (
                      <button
                        key={dividend.dividend_id}
                        onClick={() => setSelectedDividend(dividend)}
                        className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold">{dividend.ticker}</span>
                          <span className="text-emerald-300 font-bold">
                            ${dividend.total_dividend_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-blue-300 text-sm">
                          {dividend.payment_date 
                            ? new Date(dividend.payment_date).toLocaleDateString()
                            : 'Not set'
                          }
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages[summary.year] > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handlePageChange(summary.year, (currentPage[summary.year] || 1) - 1)}
                        disabled={(currentPage[summary.year] || 1) === 1}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-white">
                        Page {currentPage[summary.year] || 1} of {totalPages[summary.year]}
                      </span>
                      <button
                        onClick={() => handlePageChange(summary.year, (currentPage[summary.year] || 1) + 1)}
                        disabled={(currentPage[summary.year] || 1) >= totalPages[summary.year]}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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