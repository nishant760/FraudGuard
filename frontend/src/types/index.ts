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

export interface ShapContribution {
  feature: string;
  display_name: string;
  category: string;
  raw_value?: string | number;
  shap_value: number;
  impact_pct: number;
  direction: 'RISK_INCREASING' | 'RISK_DECREASING';
  description: string;
}

export interface ShapExplanation {
  base_value: number;
  contributions: ShapContribution[];
  top_risk_drivers: string[];
  top_safe_drivers: string[];
}

export interface ExplanationFactor {
  feature: string;
  direction: 'increases_risk' | 'reduces_risk' | string;
  relative_impact: number;
}

export interface Explanation {
  available: boolean;
  top_risk_factors?: ExplanationFactor[] | null;
  top_protective_factors?: ExplanationFactor[] | null;
  error?: string | null;
}

export interface PredictResponse {
  transaction_id: string;
  prediction: 0 | 1;
  prediction_label?: string;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  explanation?: Explanation;
  shap_explanation?: ShapExplanation;
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

export interface GlobalShapItem {
  feature: string;
  display_name: string;
  category: string;
  importance_score: number;
  importance_pct: number;
}

export interface GlobalShapResponse {
  features: GlobalShapItem[];
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

export interface StreamTransaction {
  txn_id: string;
  step: number;
  type: string;
  amount: number;
  nameOrig: string;
  nameDest: string;
  oldbalanceOrg: number;
  newbalanceOrig: number;
  oldbalanceDest: number;
  newbalanceDest: number;
  errorBalanceOrig: number;
  errorBalanceDest: number;
  orig_txn_count_window: number;
  orig_amount_sum_window: number;
  fraud_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  is_fraud_predicted: 0 | 1;
  latency_ms: number;
  timestamp: string;
  otp_code?: string;
  auth_status?: 'AUTO_APPROVED' | 'PENDING_2FA' | 'APPROVED_2FA' | 'ABORTED';
  shap_drivers?: string[];
  card_type?: 'credit' | 'debit';
  card_network?: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
}


