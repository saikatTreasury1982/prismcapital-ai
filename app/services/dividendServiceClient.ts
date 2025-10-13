import { CreateDividendInput, Dividend } from '../lib/types/dividend';

export async function createDividend(userId: string, input: CreateDividendInput): Promise<Dividend> {
  const response = await fetch('/api/dividends', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      dividendData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create dividend');
  }

  const result = await response.json();
  return result.data;
}

export async function updateDividend(dividendId: string, input: CreateDividendInput): Promise<Dividend> {
  const response = await fetch('/api/dividends', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dividendId,
      dividendData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update dividend');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteDividend(dividendId: string): Promise<void> {
  const response = await fetch(`/api/dividends?dividendId=${dividendId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete dividend');
  }
}