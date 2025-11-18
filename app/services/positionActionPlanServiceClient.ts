import { PositionActionPlan, CreatePositionActionPlanInput, UpdatePositionActionPlanInput, CurrencyConversion } from '../lib/types/positionActionPlan';

export async function getPositionActionPlans(status?: string): Promise<PositionActionPlan[]> {
  let url = '/api/position-action-plans';
  
  if (status) {
    url += `?status=${status}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch position action plans');
  }

  const result = await response.json();
  return result.data;
}

export async function createPositionActionPlan(input: CreatePositionActionPlanInput): Promise<PositionActionPlan> {
  const response = await fetch('/api/position-action-plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create position action plan');
  }

  const result = await response.json();
  return result.data;
}

export async function updatePositionActionPlan(planId: number, input: UpdatePositionActionPlanInput): Promise<PositionActionPlan> {
  const response = await fetch('/api/position-action-plans', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      planData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update position action plan');
  }

  const result = await response.json();
  return result.data;
}

export async function deletePositionActionPlan(planId: number): Promise<void> {
  const response = await fetch(`/api/position-action-plans?planId=${planId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete position action plan');
  }
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<CurrencyConversion> {
  const response = await fetch(`/api/currency-conversion?from=${from}&to=${to}&amount=${amount}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to convert currency');
  }

  return response.json();
}