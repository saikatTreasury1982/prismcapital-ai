'use client';

import { CurrencyProvider } from '@/app/lib/contexts/CurrencyContext';
import DashboardPage from './DashboardContent';
import { CurrencyToggle } from '../components/dashboard/CurrencyToggle';

export default function DashboardWithProvider() {
  return (
    <CurrencyProvider>
      {/* Sticky Header - Outside of DashboardPage component */}
      <div className="sticky top-0 z-20 from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-xl border-b border-transparent">
        <div className="py-6 pb-1 px-4">
          <CurrencyToggle />
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <DashboardPage />
    </CurrencyProvider>
  );
}