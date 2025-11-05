import { AssetClass, AssetType, AssetClassification } from '../lib/types/transaction';

export interface CreateAssetClassificationInput {
  ticker: string;
  exchange_id: number;
  class_id: number;
  type_id?: number | null;
}

export async function getAssetClasses(): Promise<AssetClass[]> {
  const response = await fetch('/api/asset-classes');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch asset classes');
  }

  const result = await response.json();
  return result.data;
}

export async function getAssetTypes(classId?: number): Promise<AssetType[]> {
  let url = '/api/asset-types';
  if (classId) {
    url += `?classId=${classId}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch asset types');
  }

  const result = await response.json();
  return result.data;
}

export async function getAssetClassification(ticker: string, exchangeId: number ): Promise<AssetClassification | null> {
  const response = await fetch(`/api/asset-classifications?ticker=${ticker}&exchangeId=${exchangeId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch asset classification');
  }

  const result = await response.json();
  return result.data;
}

export async function saveAssetClassification(input: CreateAssetClassificationInput): Promise<AssetClassification> {
  const response = await fetch('/api/asset-classifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({classificationData: input})
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save asset classification');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteAssetClassification(classificationId: string): Promise<void> {
  const response = await fetch(`/api/asset-classifications?classificationId=${classificationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete asset classification');
  }
}