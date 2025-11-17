import { TradeAnalysis, CreateTradeAnalysisInput, UpdateTradeAnalysisInput } from '../lib/types/tradeAnalysis';

export async function getTradeAnalyses(status?: string, isFlagged?: boolean): Promise<TradeAnalysis[]> {
  let url = '/api/trade-analyses';
  const params = new URLSearchParams();
  
  if (status) params.append('status', status);
  if (isFlagged !== undefined) params.append('isFlagged', isFlagged.toString());
  
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trade analyses');
  }

  const result = await response.json();
  return result.data;
}

export async function createTradeAnalysis(input: CreateTradeAnalysisInput): Promise<TradeAnalysis> {
  const response = await fetch('/api/trade-analyses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysisData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create trade analysis');
  }

  const result = await response.json();
  return result.data;
}

export async function updateTradeAnalysis(analysisId: number, input: UpdateTradeAnalysisInput): Promise<TradeAnalysis> {
  const response = await fetch('/api/trade-analyses', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysisId,
      analysisData: input
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update trade analysis');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteTradeAnalysis(analysisId: number): Promise<void> {
  const response = await fetch(`/api/trade-analyses?analysisId=${analysisId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete trade analysis');
  }
}