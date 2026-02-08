'use client';

import { memo } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';

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

interface MiniChartsProps {
  data: ChartData[];
  displayCurrency?: string;
  fxRate?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const MiniCharts = memo(function MiniCharts({ data, displayCurrency = 'USD', fxRate = 1 }: MiniChartsProps) {
  const formatCurrency = (value: number) => {
    const converted = value * fxRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-2 shadow-lg">
          <p className="text-white font-semibold text-xs mb-1">{dataPoint.typeName || dataPoint.typeCode}</p>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-blue-300">Capital:</span>
              <span className="text-blue-400 font-semibold">
                {formatCurrency(dataPoint.capitalInvested || dataPoint.value)}
              </span>
            </div>
            {dataPoint.currentValue && (
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-emerald-300">Current:</span>
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(dataPoint.currentValue)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Prepare data for pie chart
  const totalInvestment = data.reduce((sum, item) => sum + item.capitalInvested, 0);
  const pieData = data.map(item => ({
    name: item.typeCode,
    typeCode: item.typeCode,
    typeName: item.typeName,
    description: item.description,
    value: item.capitalInvested,
    capitalInvested: item.capitalInvested,
    currentValue: item.currentValue,
    tickers: item.tickers,
    percentage: ((item.capitalInvested / totalInvestment) * 100).toFixed(1)
  }));

  // ========================================
  // 🎯 SIZE CONTROL VARIABLES
  // ========================================
  const CHART_HEIGHT = 160;           // Current: 100, Try: 120, 140, 160
  const PIE_OUTER_RADIUS = 60;        // Current: 35, Try: 40, 45, 50
  const PIE_INNER_RADIUS = 30;        // Current: 22, Try: 25, 28, 30
  const CONTAINER_PADDING = 'p-4';    // Current: p-3, Try: p-4
  const BOTTOM_MARGIN = 'mb-6';       // Current: mb-6, Try: mb-8
  const DOT_SIZE = 3;                 // Current: 3, Try: 4, 5

  return (
    <div className={`flex gap-4 ${BOTTOM_MARGIN}`}>
      {/* Mini Pie Chart */}
      <div className={`flex-1 bg-white/5 rounded-xl ${CONTAINER_PADDING} border border-white/10`}>
        <h4 className="text-xs font-semibold text-white mb-2">Capital by Type</h4>
        <div className="flex gap-3">
          {/* Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={PIE_OUTER_RADIUS}
                  innerRadius={PIE_INNER_RADIUS}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (props.outerRadius as number) + 15;
                    const x = (props.cx as number) + radius * Math.cos(-(props.midAngle as number) * RADIAN);
                    const y = (props.cy as number) + radius * Math.sin(-(props.midAngle as number) * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > (props.cx as number) ? 'start' : 'end'}
                        dominantBaseline="central"
                        style={{ fontSize: '9px', fontWeight: '600' }}
                      >
                        {`${props.percentage}%`}
                      </text>
                    );
                  }}
                  labelLine={{
                    stroke: 'rgba(255, 255, 255, 0.4)',
                    strokeWidth: 1
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
          
          {/* Legend */}
          <div className="flex flex-col justify-center gap-1.5 min-w-[100px]">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white text-[10px]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Line Chart */}
      <div className={`flex-1 bg-white/5 rounded-xl ${CONTAINER_PADDING} border border-white/10 overflow-visible`}>
        <h4 className="text-xs font-semibold text-white mb-2">Capital vs Value</h4>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={data} margin={{ bottom: 5, left: 10, right: 10 }}>
            <XAxis 
              dataKey="typeCode" 
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 6 }}
              stroke="rgba(255,255,255,0.5)"
              angle={-45}
              textAnchor="end"
              height={20}
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }}
              stroke="rgba(255,255,255,0.7)"
              width={30}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="capitalInvested" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: DOT_SIZE }}
            />
            <Line 
              type="monotone" 
              dataKey="currentValue" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: DOT_SIZE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default MiniCharts;