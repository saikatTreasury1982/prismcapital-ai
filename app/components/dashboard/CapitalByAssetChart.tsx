'use client';

import { memo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Asset {
  typeCode: string;
  typeName: string;
  description: string;
  capitalInvested: number;
  currentValue: number;
  percentage: string;
  tickers: any[];
}

interface Props {
  data: Asset[];
  displayCurrency: string;
  fxRate: number;
  onHover: (asset: Asset | null) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CapitalByAssetChart = memo(function CapitalByAssetChart({ data, onHover }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const pieData = data.map(item => ({ ...item, name: item.typeCode, value: item.capitalInvested }));

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Capital Investment by Asset Type</h3>
      <div
        onMouseLeave={() => { setActiveIndex(-1); onHover(null); }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              dataKey="value"
              onMouseEnter={(_, index) => { setActiveIndex(index); onHover(pieData[index]); }}
              label={(props: any) => {
                const RADIAN = Math.PI / 180;
                const radius = props.outerRadius + 30;
                const x = props.cx + radius * Math.cos(-props.midAngle * RADIAN);
                const y = props.cy + radius * Math.sin(-props.midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > props.cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '14px' }}>
                    {`${props.percentage}%`}
                  </text>
                );
              }}
              labelLine={{ stroke: 'rgba(255,255,255,0.6)', strokeWidth: 2 }}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                    transition: 'filter 0.3s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          {pieData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => { setActiveIndex(index); onHover(entry); }}
              title={`${entry.typeName}${entry.description ? '\n' + entry.description : ''}`}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-white text-sm">{entry.typeCode}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default CapitalByAssetChart;