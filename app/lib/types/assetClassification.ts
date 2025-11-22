export interface AssetClass {
  class_code: string;
  class_name: string;
  description: string | null;
  created_at: string;
}

export interface AssetType {
  type_code: string;
  type_name: string;
  description: string | null;
  created_at: string;
}

export interface AssetClassification {
  classification_id: string;
  user_id: string;
  ticker: string;
  exchange_id: string;
  class_id: number;
  type_id: number | null;
  custom_tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetClassificationInput {
  ticker: string;
  exchange_id: number;
  class_id: number;
  type_id?: number | null;
  custom_tags?: string[];
  notes?: string;
}

export interface UpdateAssetClassificationInput {
  class_id: number;
  type_id?: number | null;
  custom_tags?: string[];
  notes?: string;
}