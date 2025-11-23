
import { db, schema } from '../lib/db';
import { eq, and } from 'drizzle-orm';

const { assetClassifications, assetTypes } = schema;

export interface AssetClassification {
  classification_id: string;
  user_id: string;
  ticker: string;
  exchange_id: string;
  class_id: string;
  type_id: string;
  asset_types: {
    type_code: string;
    type_name: string;
  }[];
}

/**
 * Get asset classification for a ticker
 * Returns the strategy type for automatic processing
 */
export async function getAssetClassification(
  ticker: string,
  exchangeId: number,
  userId: string
): Promise<{ classification: AssetClassification; strategyCode: string; strategyName: string } | null> {
  const data = await db
    .select({
      classification: assetClassifications,
      assetType: assetTypes,
    })
    .from(assetClassifications)
    .innerJoin(assetTypes, eq(assetClassifications.type_id, assetTypes.type_code))
    .where(
      and(
        eq(assetClassifications.user_id, userId),
        eq(assetClassifications.ticker, ticker)
      )
    )
    .limit(1);

  if (!data || data.length === 0) {
    console.error('No asset classification found');
    return null;
  }

  const result = data[0];

  return {
    classification: {
      ...result.classification,
      asset_types: result.assetType ? [result.assetType] : []
    } as AssetClassification,
    strategyCode: result.assetType?.type_code || '',
    strategyName: result.assetType?.type_name || ''
  };
}