'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DividendSummaryByQuarter, Dividend } from '../../lib/types/dividend';
import { DividendDetailModal } from './DividendDetailModal';
import { CURRENT_USER_ID } from '../../lib/auth';

export function ByQuarterView() {
  const [summaries, setSummaries] = useState<DividendSummaryByQuarter[]>([]);
  const [expandedQuarter, setExpandedQuarter] = useState<string | null>(null);
  const [quarterDividends, setQuarterDividends] = useState<Record<string, Dividend[]>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch(`/api/dividends-by-quarter?userId=${CURRENT_USER_ID}`);
        const result = await res.json();
        setSummaries(result.data);
      } catch (error) {
        console.error('Error fetching quarter summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  const getQuarterKey = (year: number, quarter: number) => `${year}-Q${quarter}`;

  const handleQuarterClick = async (year: number, quarter: number) => {
    const key = getQuarterKey(year, quarter);
    
    if (expandedQuarter === key) {
      setExpandedQuarter(null);
      return;
    }

    setExpandedQuarter(key);

    if (!quarterDividends[key]) {
      try {
        const page = currentPage[key] || 1;
        const res = await fetch(`/api/dividends-by-quarter?userId=${CURRENT_USER_ID}&year=${year}&quarter=${quarter}&page=${page}&pageSize=5`);
        const result = await res.json();
        const { data, total } = result;
        setQuarterDividends(prev => ({ ...prev, [key]: data }));
        setTotalPages(prev => ({ ...prev, [key]: Math.ceil(total / 5) }));
        setCurrentPage(prev => ({ ...prev, [key]: 1 }));
      } catch (error) {
        console.error('Error fetching dividends for quarter:', error);
      }
    }
  };

  const handlePageChange = async (year: number, quarter: number, newPage: number) => {
    const key = getQuarterKey(year, quarter);
    
    try {
      const res = await fetch(`/api/dividends-by-quarter?userId=${CURRENT_USER_ID}&year=${year}&quarter=${quarter}&page=${newPage}&pageSize=5`);
      const result = await res.json();
      const { data } = result;
      setQuarterDividends(prev => ({ ...prev, [key]: data }));
      setCurrentPage(prev => ({ ...prev, [key]: newPage }));
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
          const key = getQuarterKey(summary.year, summary.quarter);
          
          return (
            <div
              key={key}
              className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden flex flex-col h-fit"
            >
              <button
                onClick={() => handleQuarterClick(summary.year, summary.quarter)}
                className="w-full p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">Q{summary.quarter} {summary.year}</h3>
                    <p className="text-blue-200 text-xs">
                      {new Date(summary.quarter_start_date).toLocaleDateString()} - {new Date(summary.quarter_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  {expandedQuarter === key ? (
                    <ChevronUp className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="text-emerald-300 font-bold text-lg">
                    ${summary.total_dividends_received.toFixed(2)}
                  </div>
                  <div className="text-blue-300">
                    {summary.total_dividend_payments} payments
                  </div>
                  <div className="text-purple-300">
                    {summary.stocks_paid_dividends} stocks
                  </div>
                </div>
              </button>

              {expandedQuarter === key && quarterDividends[key] && (
                <div className="border-t border-white/20 p-4 bg-white/5">
                  <div className="space-y-3">
                    {quarterDividends[key].map((dividend) => (
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
                          {new Date(dividend.payment_date).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages[key] > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handlePageChange(summary.year, summary.quarter, (currentPage[key] || 1) - 1)}
                        disabled={(currentPage[key] || 1) === 1}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-white">
                        Page {currentPage[key] || 1} of {totalPages[key]}
                      </span>
                      <button
                        onClick={() => handlePageChange(summary.year, summary.quarter, (currentPage[key] || 1) + 1)}
                        disabled={(currentPage[key] || 1) >= totalPages[key]}
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

      <DividendDetailModal dividend={selectedDividend} onClose={() => setSelectedDividend(null)} />
    </>
  );
}