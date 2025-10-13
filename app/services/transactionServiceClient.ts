import { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransactionInput 
} from '../lib/types/transaction';

export async function createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
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

export async function getTransactions(userId: string, ticker?: string): Promise<Transaction[]> {
  let url = `/api/transactions?userId=${userId}`;
  if (ticker) {
    url += `&ticker=${encodeURIComponent(ticker)}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transactions');
  }

  const result = await response.json();
  return result.data;
}

export async function getTransaction(transactionId: string): Promise<Transaction> {
  const response = await fetch(`/api/transactions?transactionId=${transactionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transaction');
  }

  const result = await response.json();
  return result.data;
}

export async function updateTransaction(transactionId: string, input: UpdateTransactionInput): Promise<Transaction> {
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

export async function deleteTransaction(transactionId: string): Promise<void> {
  const response = await fetch(`/api/transactions?transactionId=${transactionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete transaction');
  }
}