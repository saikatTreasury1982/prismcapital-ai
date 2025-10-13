import { Position } from '../lib/types/transaction';

export async function getPositions(userId: string, isActive?: boolean): Promise<Position[]> {
  let url = `/api/positions?userId=${userId}`;
  
  if (isActive !== undefined) {
    url += `&isActive=${isActive}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch positions');
  }

  const result = await response.json();
  return result.data;
}