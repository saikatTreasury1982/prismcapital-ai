'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  homeCurrency: string;
  tradingCurrency: string;
  displayCurrency: string;
  fxRate: number;
  setDisplayCurrency: (currency: string) => void;
  setHomeCurrency: (currency: string) => void;
  setTradingCurrency: (currency: string) => void;
  setFxRate: (rate: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [homeCurrency, setHomeCurrency] = useState<string>('');
  const [tradingCurrency, setTradingCurrency] = useState<string>('');
  const [displayCurrency, setDisplayCurrency] = useState<string>('');
  const [fxRate, setFxRate] = useState<number>(1);

  return (
    <CurrencyContext.Provider
      value={{
        homeCurrency,
        tradingCurrency,
        displayCurrency,
        fxRate,
        setDisplayCurrency,
        setHomeCurrency,
        setTradingCurrency,
        setFxRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}