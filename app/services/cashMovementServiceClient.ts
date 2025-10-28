import { CreateCashMovementInput, CashMovement, CashMovementWithDirection } from '../lib/types/funding';

export async function createCashMovement(
  userId: string, 
  input: CreateCashMovementInput
): Promise<CashMovement> {
  // Call the API endpoint instead of direct DB access
  const response = await fetch('/api/cash-movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      movementData: input,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create cash movement');
  }

  const { data } = await response.json();
  return data;
}

export async function getUniquePeriods(userId: string): Promise<Array<{period_from: string, period_to: string | null, period_display: string}>> {
  const response = await fetch(`/api/cash-movements/periods?userId=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch periods');
  }

  const { data } = await response.json();
  return data;
}

export async function getMovementsForPeriod(userId: string, periodFrom: string, periodTo: string | null): Promise<CashMovementWithDirection[]> {
  const params = new URLSearchParams({
    userId,
    periodFrom,
    ...(periodTo && { periodTo }),
  });

  const response = await fetch(`/api/cash-movements/by-period?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch movements');
  }

  const { data } = await response.json();
  return data;
}