'use client';

import { memo, useState } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Sector } from 'recharts';

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

interface CapitalByAssetChartProps {
  data: ChartData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CapitalByAssetChart = memo(function CapitalByAssetChart({ data }: CapitalByAssetChartProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2 border-b border-white/20 pb-2">
            {dataPoint.typeName}
          </p>
          {dataPoint.description && (
            <p className="text-blue-300 text-xs mb-2">{dataPoint.description}</p>
          )}
          
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

  const InfoPanel = ({ asset }: { asset: any }) => {
    if (!asset) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-blue-300 text-sm text-center">
            Hover over a slice or legend item to view details
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-white/20 pb-3 mb-3">
          <h4 className="text-white font-bold text-lg">{asset.typeCode}</h4>
          <p className="text-blue-200 text-sm">{asset.typeName}</p>
          {asset.description && (
            <p className="text-blue-300 text-xs mt-1">{asset.description}</p>
          )}
        </div>

        {/* Summary Stats */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-blue-300 text-xs mb-1">Capital Invested</p>
            <p className="text-blue-400 font-semibold text-lg">
              {formatCurrency(asset.capitalInvested)}
            </p>
          </div>
          <div>
            <p className="text-emerald-300 text-xs mb-1">Current Value</p>
            <p className="text-emerald-400 font-semibold text-lg">
              {formatCurrency(asset.currentValue)}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-blue-200 text-xs mb-1">Portfolio Allocation</p>
            <p className="text-white font-bold text-2xl">
              {asset.percentage}%
            </p>
          </div>
        </div>

        {/* Holdings List */}
        {asset.tickers && asset.tickers.length > 0 && (
          <div className="flex-1 border-t border-white/20 pt-3">
            <p className="text-blue-200 text-xs font-semibold mb-2">
              Holdings ({asset.tickers.length})
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {asset.tickers.map((ticker: any, idx: number) => (
                <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">{ticker.ticker}</span>
                  </div>
                  <p className="text-blue-200 text-[10px] mb-1 truncate">
                    {ticker.tickerName}
                  </p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-blue-300">
                      {formatCurrency(ticker.capitalInvested)}
                    </span>
                    <span className="text-blue-300">→</span>
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
  };

  // Prepare data for pie chart with percentages
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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
    setSelectedAsset(pieData[index]);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Capital Investment by Asset Type</h3>
      
      {/* Split Layout: Pie 60% + Info Panel 40% */}
      <div className="flex gap-6">
        {/* Pie Chart Section */}
        <div 
          className="flex-[0.6]"
          onMouseLeave={() => {
            setSelectedAsset(null);
            setActiveIndex(-1);
          }}
        >
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
                onMouseEnter={onPieEnter}
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
                      style={{ fontSize: '14px' }}
                    >
                      {`${props.percentage}%`}
                    </text>
                  );
                }}
                labelLine={{
                  stroke: 'rgba(255, 255, 255, 0.6)',
                  strokeWidth: 2
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                      transition: 'filter 0.3s ease',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Custom Legend Below Chart */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            {pieData.map((entry, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 cursor-pointer"
                onMouseEnter={() => {
                  setActiveIndex(index);
                  setSelectedAsset(entry);
                }}
                onMouseLeave={() => {
                  setSelectedAsset(null);
                  setActiveIndex(-1);
                }}
                title={`${entry.typeName}${entry.description ? '\n' + entry.description : ''}`}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white text-sm">{entry.typeCode}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Panel Section */}
        <div className="flex-[0.4] bg-white/5 rounded-xl p-4 border border-white/10">
          <InfoPanel asset={selectedAsset} />
        </div>
      </div>
    </div>
  );
});

export default CapitalByAssetChart;