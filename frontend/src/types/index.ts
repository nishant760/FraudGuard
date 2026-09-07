// ──────────────────────────────────────────────────────────────────────────────
// API Request Types
// ──────────────────────────────────────────────────────────────────────────────

export interface TransactionPredictRequest {
  TransactionAmt: number;
  TransactionDT?: number;
  card1?: number;
  card2?: number;
  addr1?: number;
  C1?: number;
  C5?: number;
  ProductCD?: string;
  card4?: string;
  card6?: string;
  P_emaildomain?: string;
  id_present?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PredictResponse {
  transaction_id: string;
  prediction: 0 | 1;
  prediction_label?: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface TransactionHistoryItem {
  transaction_id: string;
  transaction_amount: number;
  ProductCD?: string;
  card4?: string;
  card6?: string;
  prediction: 0 | 1;
  prediction_label?: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  model_used?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_transactions: number;
  total_fraud: number;
  total_legitimate: number;
  fraud_rate: number;
  avg_risk_score: number;
  avg_transaction_amount: number;
}

export interface RiskDistributionItem {
  risk_level: RiskLevel;
  count: number;
  percentage: number;
}

export interface RiskDistributionResponse {
  distribution: RiskDistributionItem[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Model Performance Types (static data used in Analytics page)
// ──────────────────────────────────────────────────────────────────────────────

export interface ModelMetrics {
  name: string;
  recall: number;
  precision: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}
