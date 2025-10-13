import { Exchange } from '../lib/types/transaction';

export async function getExchanges(): Promise<Exchange[]> {
  // Since exchanges is a reference table that rarely changes,
  // we can fetch it directly or cache it
  const response = await fetch('/api/exchanges');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch exchanges');
  }

  const result = await response.json();
  return result.data;
}