'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import InvestmentCard from '../components/dashboard/InvestmentCard';
import FundingCard from '../components/dashboard/FundingCard';
import InvestmentCharts from '../components/dashboard/InvestmentCharts';

interface ChartData {
  type: string;
  capitalInvested: number;
  currentValue: number;
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [investmentData, setInvestmentData] = useState<InvestmentData | null>(null);
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvestmentData();
      fetchFundingData();
      fetchChartData();
    }
  }, [status]);

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
        <h1 className="text-3xl font-bold text-white mb-2">
          Portfolio Summary | {session?.user?.id}
        </h1>
        <p className="text-blue-200">
          {new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })}
        </p>
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
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 max-w-8xl">
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
    </div>
  );
}