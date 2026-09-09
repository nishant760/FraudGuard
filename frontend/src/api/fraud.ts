import apiClient from './client';
import type {
  TransactionPredictRequest,
  PredictResponse,
  TransactionHistoryItem,
  AnalyticsSummary,
  RiskDistributionResponse,
  GlobalShapResponse,
} from '../types';

// POST /predict
export const predictTransaction = async (
  payload: TransactionPredictRequest
): Promise<PredictResponse> => {
  const { data } = await apiClient.post<PredictResponse>('/predict', payload);
  return data;
};

// GET /transactions
export const getTransactions = async (params?: {
  risk_level?: string;
  prediction?: number;
}): Promise<TransactionHistoryItem[]> => {
  const { data } = await apiClient.get<TransactionHistoryItem[]>('/transactions', {
    params,
  });
  return data;
};

// GET /transactions/:id
export const getTransactionById = async (id: string): Promise<TransactionHistoryItem> => {
  const { data } = await apiClient.get<TransactionHistoryItem>(`/transactions/${id}`);
  return data;
};

// GET /analytics/summary
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const { data } = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return data;
};

// GET /analytics/risk-distribution
export const getRiskDistribution = async (): Promise<RiskDistributionResponse> => {
  const { data } = await apiClient.get<RiskDistributionResponse>('/analytics/risk-distribution');
  return data;
};

// GET /analytics/global-shap
export const getGlobalShapImportance = async (): Promise<GlobalShapResponse> => {
  const { data } = await apiClient.get<GlobalShapResponse>('/analytics/global-shap');
  return data;
};

// GET /health
export const checkHealth = async (): Promise<{ status: string }> => {
  const { data } = await apiClient.get<{ status: string }>('/health');
  return data;
};

