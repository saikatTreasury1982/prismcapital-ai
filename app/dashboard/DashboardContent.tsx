'use client';

import { useEffect, useState } from 'react';
import { CoinsIcon, CurrencyIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCurrency } from '../lib/contexts/CurrencyContext';
import InvestmentCard from '../components/dashboard/InvestmentCard';
import FundingCard from '../components/dashboard/FundingCard';
import DividendCard from '../components/dashboard/DividendCard';
import CapitalByAssetChart from '../components/dashboard/CapitalByAssetChart';
import CapitalVsValueChart from '../components/dashboard/CapitalVsValueChart';
import PositionDetailsStandard from '../components/dashboard/PositionDetailsStandard';
import PositionDetailsByStrategy from '../components/dashboard/PositionDetailsByStrategy';
import DividendBreakdownTable from '../components/dashboard/DividendBreakdownTable';
import { AssetTypeMobileCards } from '../components/dashboard/AssetTypeMobileCards';

interface StrategyData {
  strategies: any[];
}

interface ChartData {
  typeCode: string;
  typeName: string;
  description: string;
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
    totalRealizedPnL: number;
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
    totalStocks: number;
    ytdDividends: number;
    ytdStocks: number;
    ytdPayments: number;
    upcomingDividends: number;
    upcomingPayments: number;
  };
  allTimeBreakdown: any[];
  ytdBreakdown: any[];
}

type InvestmentView = 'standard' | 'strategy' | null;
type DividendView = 'alltime' | 'ytd' | null;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  // Get currency state from context
  const { 
    homeCurrency, 
    tradingCurrency, 
    displayCurrency, 
    fxRate, 
    setHomeCurrency, 
    setTradingCurrency, 
    setDisplayCurrency, 
    setFxRate 
  } = useCurrency();
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // View states
  const [investmentView, setInvestmentView] = useState<InvestmentView>(null);
  const [dividendView, setDividendView] = useState<DividendView>(null);
  const [chartView, setChartView] = useState<'pie' | 'line'>('pie');

  // Initial setup - fetch currencies once
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserCurrencies();
    }
  }, [status]);

  // Initial data fetch - only when currencies are first loaded
  useEffect(() => {
    if (homeCurrency && tradingCurrency && displayCurrency && fxRate) {
      fetchInvestmentData();
      fetchFundingData();
      fetchChartData();
      fetchDividendData();
      fetchStrategyData();
    }
  }, [homeCurrency, tradingCurrency]); // Only run once when currencies loaded

  // When display currency changes - fetch FX rate and funding data only
  useEffect(() => {
    if (homeCurrency && tradingCurrency && displayCurrency) {
      fetchFxRate();
      fetchFundingData(); // Only funding needs re-fetch, others use FX conversion
    }
  }, [displayCurrency]);

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

      await fetchInvestmentData();
      await fetchChartData();
      await fetchStrategyData();

      setTimeout(() => setRefreshMessage(null), 5000);
    } catch (error: any) {
      console.error('Error refreshing prices:', error);
      setRefreshMessage('Failed to refresh prices');
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  const handleInvestmentViewChange = (view: InvestmentView) => {
    setInvestmentView(view);
    if (view) {
      setDividendView(null); // Clear dividend view
    }
  };

  const handleDividendViewChange = (view: DividendView) => {
    setDividendView(view);
    if (view) {
      setInvestmentView(null); // Clear investment view
    }
  };

  const fetchUserCurrencies = async () => {
    try {
      // Fetch user data (home_currency)
      const userResponse = await fetch('/api/user/data');
      if (!userResponse.ok) throw new Error('Failed to fetch user data');
      const userData = await userResponse.json();

      // Fetch user preferences (default_trading_currency)
      const prefsResponse = await fetch(`/api/user/preferences?userId=${userData.user_id}`);
      if (!prefsResponse.ok) throw new Error('Failed to fetch user preferences');
      const prefsData = await prefsResponse.json();

      // Validate that both currencies are set
      if (!userData.home_currency || !prefsData.default_trading_currency) {
        const missingFields = [];
        if (!userData.home_currency) missingFields.push('Home Currency');
        if (!prefsData.default_trading_currency) missingFields.push('Trading Currency');

        throw new Error(
          `Required currency configuration missing: ${missingFields.join(', ')}. ` +
          `Please update your profile settings to continue.`
        );
      }

      setHomeCurrency(userData.home_currency);
      setTradingCurrency(prefsData.default_trading_currency);
      setDisplayCurrency(prefsData.default_trading_currency); // Default to trading currency
    } catch (error: any) {
      console.error('Error fetching user currencies:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchFxRate = async () => {
    try {
      // Conversion: Trading Currency (USD) → Display Currency (AUD or USD)
      const from = tradingCurrency;
      const to = displayCurrency;

      const response = await fetch(`/api/yahoo-fx?from=${from}&to=${to}`);
      if (!response.ok) throw new Error('Failed to fetch FX rate');

      const data = await response.json();
      setFxRate(data.rate || 1);
    } catch (error: any) {
      console.error('Error fetching FX rate:', error);
      setFxRate(1); // Fallback to 1:1
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
      // Determine if we want home or trading currency
      const currencyParam = displayCurrency === homeCurrency ? 'home' : 'trading';

      const response = await fetch(`/api/dashboard/funding?currency=${currencyParam}`);

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

  // Show error if currencies not configured
  if (error && error.includes('currency configuration missing')) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="backdrop-blur-xl bg-red-500/10 rounded-3xl p-8 border border-red-500/30 max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Configuration Required</h2>
            <p className="text-white mb-6">{error}</p>
            <a
              href="/settings"
              className="inline-block px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-xl text-white font-semibold transition-all"
            >
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="p-8 pt-4">
        {/* 40/60 Split Layout */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-[2000px] mx-auto" key={displayCurrency}>
          {/* LEFT SECTION - 40% */}
          <div className="w-full lg:w-[40%] space-y-6">
            {/* Investment Overview - Non-collapsible */}
            {investmentData && (
              <InvestmentCard
                summary={investmentData.summary}
                onRefresh={handleRefreshPrices}
                isRefreshing={isRefreshingPrices}
                refreshMessage={refreshMessage}
                onViewChange={handleInvestmentViewChange}
                activeView={investmentView}
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}

            {/* Dividend Overview - Non-collapsible */}
            {dividendData && (
              <DividendCard
                summary={dividendData.summary}
                onViewChange={handleDividendViewChange}
                activeView={dividendView}
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}

            {/* Funding Overview - Collapsible */}
            {fundingData && (
              <FundingCard
                summary={fundingData.summary}
                details={fundingData.details}
              />
            )}
          </div>

          {/* GRADIENT DIVIDER */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          {/* RIGHT SECTION - 60% */}
          <div className="w-full lg:w-[60%] space-y-6">
            {/* Show charts by default when no views are active */}
            {!investmentView && !dividendView && chartData.length > 0 && (
              <>
                {/* Desktop/Tablet: Tabbed Charts (≥768px) */}
                <div className="hidden md:block">
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/20">
                      <button
                        onClick={() => setChartView('pie')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${chartView === 'pie'
                          ? 'text-white bg-white/10 border-b-2 border-blue-400'
                          : 'text-blue-300 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        By Asset Type
                      </button>
                      <button
                        onClick={() => setChartView('line')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${chartView === 'line'
                          ? 'text-white bg-white/10 border-b-2 border-blue-400'
                          : 'text-blue-300 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        Capital vs Value
                      </button>
                    </div>

                    {/* Chart Content */}
                    <div className="px-10 py-15">
                      {chartView === 'pie' ? (
                        <CapitalByAssetChart data={chartData} displayCurrency={displayCurrency} fxRate={fxRate} />
                      ) : (
                        <CapitalVsValueChart data={chartData} displayCurrency={displayCurrency} fxRate={fxRate} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile: Card Summary (<768px) */}
                <div className="md:hidden">
                  <AssetTypeMobileCards data={chartData} displayCurrency={displayCurrency} fxRate={fxRate} />
                </div>
              </>
            )}

            {/* Investment Standard View */}
            {investmentView === 'standard' && investmentData && (
              <PositionDetailsStandard
                positions={investmentData.positions}
                chartData={chartData}
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}

            {/* Investment By Strategy View */}
            {investmentView === 'strategy' && strategyData && (
              <PositionDetailsByStrategy
                strategies={strategyData.strategies}
                chartData={chartData}
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}

            {/* Dividend All-Time View */}
            {dividendView === 'alltime' && dividendData && (
              <DividendBreakdownTable
                data={dividendData.allTimeBreakdown}
                chartData={chartData}
                title="All-Time Dividend Breakdown"
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}

            {/* Dividend YTD View */}
            {dividendView === 'ytd' && dividendData && (
              <DividendBreakdownTable
                data={dividendData.ytdBreakdown}
                chartData={chartData}
                title="YTD Dividend Breakdown"
                displayCurrency={displayCurrency}
                fxRate={fxRate}
              />
            )}
          </div>
        </div>
      </div>
  );
}