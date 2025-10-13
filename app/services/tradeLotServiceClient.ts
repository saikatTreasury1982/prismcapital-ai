import { TradeLot } from '../lib/types/transaction';

export async function getTradeLots(
  userId: string, 
  ticker?: string, 
  status?: 'OPEN' | 'CLOSED' | 'PARTIAL'
): Promise<TradeLot[]> {
  let url = `/api/trade-lots?userId=${userId}`;
  
  if (ticker) {
    url += `&ticker=${encodeURIComponent(ticker)}`;
  }
  
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trade lots');
  }

  const result = await response.json();
  return result.data;
}