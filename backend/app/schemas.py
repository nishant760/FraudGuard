from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class HealthResponse(BaseModel):
    """Schema for /health endpoint response."""
    status: str = "healthy"


class TransactionPredictRequest(BaseModel):
    """
    Schema for POST /predict request payload.
    Supports IEEE-CIS style transaction features.
    """
    TransactionAmt: float = Field(..., description="Transaction amount in currency units", gt=0)
    TransactionDT: Optional[int] = Field(default=86400, description="Transaction timestamp in seconds")
    card1: Optional[float] = Field(default=None, description="Payment card identifier 1")
    card2: Optional[float] = Field(default=None, description="Payment card identifier 2")
    addr1: Optional[float] = Field(default=None, description="Billing/shipping address code 1")
    C1: Optional[float] = Field(default=None, description="Counting feature 1")
    C5: Optional[float] = Field(default=None, description="Counting feature 5")
    ProductCD: Optional[str] = Field(default=None, description="Product code/category (e.g., W, C, R, H, S)")
    card4: Optional[str] = Field(default=None, description="Card network (e.g., visa, mastercard, discover)")
    card6: Optional[str] = Field(default=None, description="Card type (e.g., credit, debit)")
    P_emaildomain: Optional[str] = Field(default=None, description="Purchaser email domain (e.g., gmail.com)")
    tx_hour: Optional[int] = Field(default=None, description="Transaction hour (0-23)", ge=0, le=23)
    tx_day: Optional[int] = Field(default=None, description="Transaction day of week (0-6)", ge=0, le=6)
    id_present: Optional[int] = Field(default=None, description="Identity information present flag (0 or 1)", ge=0, le=1)

    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "TransactionAmt": 500.0,
                "TransactionDT": 86400,
                "card1": 12345,
                "card2": 321,
                "addr1": 100,
                "C1": 2,
                "C5": 1,
                "ProductCD": "W",
                "card4": "visa",
                "card6": "credit",
                "P_emaildomain": "gmail.com",
                "id_present": 1
            }
        }
    )


class ShapContribution(BaseModel):
    feature: str
    display_name: str
    category: str
    raw_value: Optional[str] = ""
    shap_value: float
    impact_pct: float
    direction: str  # 'RISK_INCREASING' | 'RISK_DECREASING'
    description: str


class ShapExplanation(BaseModel):
    base_value: float
    contributions: List[ShapContribution]
    top_risk_drivers: List[str]
    top_safe_drivers: List[str]


class ExplanationFactor(BaseModel):
    feature: str
    direction: str
    relative_impact: float


class Explanation(BaseModel):
    available: bool
    top_risk_factors: Optional[List[ExplanationFactor]] = None
    top_protective_factors: Optional[List[ExplanationFactor]] = None
    error: Optional[str] = None


class TransactionPredictResponse(BaseModel):
    """Schema for POST /predict response payload."""
    transaction_id: str
    prediction: int
    prediction_label: str
    fraud_probability: float
    risk_score: int
    risk_level: str
    model_used: str
    explanation: Optional[Explanation] = None
    shap_explanation: Optional[ShapExplanation] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transaction_id": "TXN-A1B2C3D4",
                "prediction": 1,
                "prediction_label": "Fraud",
                "fraud_probability": 0.82,
                "risk_score": 82,
                "risk_level": "HIGH",
                "model_used": "XGBoost"
            }
        }
    )


class TransactionHistoryResponse(BaseModel):
    """Schema for item in GET /transactions list response."""
    transaction_id: str
    transaction_amount: float
    ProductCD: Optional[str] = None
    card4: Optional[str] = None
    card6: Optional[str] = None
    prediction: int
    prediction_label: str
    fraud_probability: float
    risk_score: int
    risk_level: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionDetailResponse(BaseModel):
    """Schema for GET /transactions/{transaction_id} detailed response."""
    id: int
    transaction_id: str
    transaction_amount: float
    product_category: Optional[str] = None
    prediction: int
    prediction_label: str
    fraud_probability: float
    risk_score: int
    risk_level: str
    model_used: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSummaryResponse(BaseModel):
    """Schema for GET /analytics/summary response."""
    total_transactions: int
    total_fraud: int
    total_legitimate: int
    fraud_rate: float
    avg_risk_score: float
    avg_transaction_amount: float

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_transactions": 1250,
                "total_fraud": 48,
                "total_legitimate": 1202,
                "fraud_rate": 0.0384,
                "avg_risk_score": 32.0,
                "avg_transaction_amount": 150.0
            }
        }
    )

class RiskDistributionItem(BaseModel):
    risk_level: str
    count: int
    percentage: float

class RiskDistributionResponse(BaseModel):
    """Schema for GET /analytics/risk-distribution response."""
    distribution: List[RiskDistributionItem]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "distribution": [
                    {"risk_level": "LOW", "count": 500, "percentage": 55.5},
                    {"risk_level": "MEDIUM", "count": 300, "percentage": 33.3},
                    {"risk_level": "HIGH", "count": 100, "percentage": 11.1}
                ]
            }
        }
    )


class GlobalShapItem(BaseModel):
    feature: str
    display_name: str
    category: str
    importance_score: float
    importance_pct: float


class GlobalShapResponse(BaseModel):
    """Schema for GET /analytics/global-shap response."""
    features: List[GlobalShapItem]

