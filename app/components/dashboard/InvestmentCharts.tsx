'use client';

import { memo } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

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

interface InvestmentChartsProps {
  data: ChartData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const InvestmentCharts = memo(function InvestmentCharts({ data }: InvestmentChartsProps) {
  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2 border-b border-white/20 pb-2">
            {dataPoint.type}
          </p>
          
          {/* Summary */}
          <div className="mb-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-300">Capital Invested:</span>
              <span className="text-blue-400 font-semibold">
                {formatCurrency(dataPoint.capitalInvested)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-300">Current Value:</span>
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(dataPoint.currentValue)}
              </span>
            </div>
          </div>

          {/* Ticker List */}
          {dataPoint.tickers && dataPoint.tickers.length > 0 && (
            <div className="border-t border-white/20 pt-2 mt-2">
              <p className="text-blue-200 text-xs font-semibold mb-1">Tickers:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {dataPoint.tickers.map((ticker: any, idx: number) => (
                  <div key={idx} className="text-xs bg-white/5 rounded p-1.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-white font-medium">{ticker.ticker}</span>
                      <span className="text-blue-200 text-[10px] truncate">
                        {ticker.tickerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">
                        {formatCurrency(ticker.capitalInvested)}
                      </span>
                      <span className="text-emerald-300">
                        {formatCurrency(ticker.currentValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Prepare data for pie chart with percentages
  const totalInvestment = data.reduce((sum, item) => sum + item.capitalInvested, 0);
  const pieData = data.map(item => ({
    name: item.type,
    type: item.type,
    value: item.capitalInvested,
    capitalInvested: item.capitalInvested,
    currentValue: item.currentValue,
    tickers: item.tickers,
    percentage: ((item.capitalInvested / totalInvestment) * 100).toFixed(1)
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Doughnut Chart - Capital Investment by Asset Type */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Capital Investment by Asset Type</h3>
        
        <div className="flex gap-6">
          {/* Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (props.outerRadius as number) + 30;
                    const x = (props.cx as number) + radius * Math.cos(-(props.midAngle as number) * RADIAN);
                    const y = (props.cy as number) + radius * Math.sin(-(props.midAngle as number) * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > (props.cx as number) ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ 
                          fontSize: '14px',
                        }}
                      >
                        {`${props.name}: ${props.percentage}%`}
                      </text>
                    );
                  }}
                  labelLine={{
                    stroke: 'rgba(255, 255, 255, 0.6)',
                    strokeWidth: 2
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend - Side */}
          <div className="flex flex-col justify-center gap-3 min-w-[140px]">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white text-sm">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Chart - Capital vs Current Value */}
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Capital Invested vs Current Value</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="type" 
              stroke="white"
              tick={{ fill: 'white', fontSize: 12 }}
            />
            <YAxis 
              stroke="white"
              tick={{ fill: 'white', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: 'white' }}
              formatter={(value: string) => (
                <span className="text-white text-sm">
                  {value === 'capitalInvested' ? 'Capital Invested' : 'Current Value'}
                </span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="capitalInvested" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              name="capitalInvested"
            />
            <Line 
              type="monotone" 
              dataKey="currentValue" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              name="currentValue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default InvestmentCharts;