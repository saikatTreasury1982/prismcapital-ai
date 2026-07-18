'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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

const CapitalVsValueChart = memo(function CapitalVsValueChart({ data, onHover }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Capital Invested vs Current Value</h3>
      <div onMouseLeave={() => onHover(null)}>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onMouseMove={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined && state.isTooltipActive) {
                onHover(data[state.activeTooltipIndex]);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
            <XAxis
              type="number"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="typeCode"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              width={90}
            />
            <Bar dataKey="capitalInvested" fill="#3b82f6" name="capitalInvested" radius={[0, 4, 4, 0]} />
            <Bar dataKey="currentValue" fill="#10b981" name="currentValue" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#3b82f6] rounded"></div>
            <span className="text-white text-sm">Capital Invested</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#10b981] rounded"></div>
            <span className="text-white text-sm">Current Value</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CapitalVsValueChart;