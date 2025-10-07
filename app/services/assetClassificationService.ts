import { createClient } from '@/utils/supabase/server';
import { CURRENT_USER_ID } from '@/app/lib/auth';

export interface AssetClassification {
  classification_id: string;
  user_id: string;
  ticker: string;
  exchange_id: number;
  class_id: number;
  type_id: number;
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('asset_classifications')
    .select(`
      classification_id,
      user_id,
      ticker,
      exchange_id,
      class_id,
      type_id,
      asset_types!inner (
        type_code,
        type_name
      )
    `)
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .eq('exchange_id', exchangeId)
    .single();

  if (error) {
    console.error('Error fetching asset classification:', error);
    return null;
  }

  // Extract the first asset_type from the array
  const assetType = data.asset_types[0];

  return {
    classification: data as AssetClassification,
    strategyCode: assetType.type_code,
    strategyName: assetType.type_name
  };
}