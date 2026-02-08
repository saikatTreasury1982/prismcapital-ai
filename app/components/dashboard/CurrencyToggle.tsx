'use client';

import SegmentedPills from '@/app/lib/ui/SegmentedPills';
import { useCurrency } from '@/app/lib/contexts/CurrencyContext';

export function CurrencyToggle() {
  const { tradingCurrency, homeCurrency, displayCurrency, setDisplayCurrency } = useCurrency();

  if (!homeCurrency || !tradingCurrency) return null;

  return (
    <div className="max-w-[2000px] mx-auto mb-6 flex justify-end">
      <div className="flex items-center gap-3">
        <span className="text-blue-200 text-sm font-medium">Display Currency:</span>
        <SegmentedPills
          options={[
            { value: tradingCurrency, label: tradingCurrency, activeColor:"bg-blue-500" },
            { value: homeCurrency, label: homeCurrency, activeColor:"bg-indigo-500" },
          ]}
          value={displayCurrency}
          onChange={setDisplayCurrency}
          showLabels={true}
        />
      </div>
    </div>
  );
}