'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import InvestmentCard from '../components/dashboard/InvestmentCard';
import FundingCard from '../components/dashboard/FundingCard';
import InvestmentCharts from '../components/dashboard/InvestmentCharts';
import DividendCard from '../components/dashboard/DividendCard';
import TradeStrategyCard from '../components/dashboard/TradeStrategyCard';

interface StrategyData {
  strategies: any[];
}

interface ChartData {
  type: string;
  capitalInvested: number;
  currentValue: number;
  tickers: {
    ticker: string;
    tickerName: string;
    capitalInvested: number;
    currentValue: number;
  }[];
}

interface InvestmentData {
  summary: {
    totalInvested: number;
    totalMarketValue: number;
    totalUnrealizedPnL: number;
  };
  positions: any[];
}

interface FundingData {
  summary: {
    totalDeposited: number;
    totalWithdrawn: number;
    netCashBalance: number;
    currency: string;
  };
  details: any;
}

interface DividendData {
  summary: {
    totalDividends: number;
    ytdDividends: number;
    dividendPayingStocks: number;
    ytdPayments: number;
  };
  breakdown: any[];
  quarterly: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvestmentData();
      fetchFundingData();
      fetchChartData();
      fetchDividendData();
      fetchStrategyData();
    }
  }, [status]);

  const handleRefreshPrices = async () => {
    setIsRefreshingPrices(true);
    setRefreshMessage(null);
    
    try {
      const response = await fetch('/api/positions/update-prices', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh prices');
      }

      const result = await response.json();
      setRefreshMessage(`Updated ${result.updated} of ${result.total} positions`);
      
      // Refresh dashboard data after price update
      await fetchInvestmentData();
      await fetchChartData();
      await fetchStrategyData();
      
      // Clear message after 5 seconds
      setTimeout(() => setRefreshMessage(null), 5000);
    } catch (error: any) {
      console.error('Error refreshing prices:', error);
      setRefreshMessage('Failed to refresh prices');
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setIsRefreshingPrices(false);
    }
  };
  
  const fetchStrategyData = async () => {
  try {
    const response = await fetch('/api/dashboard/strategies');
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategy data');
    }

    const data = await response.json();
    setStrategyData(data);
  } catch (err: any) {
    console.error('Error fetching strategy data:', err);
  }
  };

  const fetchDividendData = async () => {
    try {
      const response = await fetch('/api/dashboard/dividends');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dividend data');
      }

      const data = await response.json();
      setDividendData(data);
    } catch (err: any) {
      console.error('Error fetching dividend data:', err);
    }
  };

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/investments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch investment data');
      }

      const data = await response.json();
      setInvestmentData(data);
    } catch (err: any) {
      console.error('Error fetching investment data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFundingData = async () => {
    try {
      const response = await fetch('/api/dashboard/funding');
      
      if (!response.ok) {
        throw new Error('Failed to fetch funding data');
      }

      const data = await response.json();
      setFundingData(data);
    } catch (err: any) {
      console.error('Error fetching funding data:', err);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/dashboard/charts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const result = await response.json();
      setChartData(result.data);
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white text-xl">Please sign in to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Portfolio Summary | {session?.user?.id}
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-blue-200">
            {new Date().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </p>
          
          {/* Refresh Prices Button */}
          <button
            onClick={handleRefreshPrices}
            disabled={isRefreshingPrices}
            className={`w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-600 flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
              isRefreshingPrices ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            title="Refresh Market Prices"
          >
            <svg
              className={`w-4 h-4 text-white ${isRefreshingPrices ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Refresh Status Message */}
        {refreshMessage && (
          <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
            <p className="text-blue-300 text-sm">{refreshMessage}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <InvestmentCharts data={chartData} />
        </div>
      )}

      {/* Cards Section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 max-w-8xl items-start">
        {investmentData && (
          <div className="xl:col-span-3">
            <InvestmentCard
              summary={investmentData.summary}
              positions={investmentData.positions}
            />
          </div>
        )}
        
        {fundingData && (
          <div className="xl:col-span-2">
            <FundingCard
              summary={fundingData.summary}
              details={fundingData.details}
            />
          </div>
        )}
      </div>
      
      {/* Dividend and Strategy Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-8xl mt-6 items-start">
        {dividendData && (
          <DividendCard
            summary={dividendData.summary}
            breakdown={dividendData.breakdown}
            quarterly={dividendData.quarterly}
          />
        )}
        
        {strategyData && (
          <TradeStrategyCard strategies={strategyData.strategies} />
        )}
      </div>    
    </div>
  );
}