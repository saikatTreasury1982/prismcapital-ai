import { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransactionInput 
} from '../lib/types/transaction';

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transaction');
  }

  const result = await response.json();
  return result.data;
}

export async function getTransactions(ticker?: string): Promise<Transaction[]> {
  let url = `/api/transactions`;
  if (ticker) {
    url += `?ticker=${encodeURIComponent(ticker)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transactions');
  }

  const result = await response.json();
  return result.data;
}

export async function getTransaction(transactionId: number): Promise<Transaction> {
  const response = await fetch(`/api/transactions?transactionId=${transactionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transaction');
  }

  const result = await response.json();
  return result.data;
}

export async function updateTransaction(transactionId: number, input: UpdateTransactionInput): Promise<Transaction> {
  const response = await fetch('/api/transactions', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactionId,
      transactionData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update transaction');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteTransaction(transactionId: number): Promise<void> {
  const response = await fetch(`/api/transactions?transactionId=${transactionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete transaction');
  }
}