from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalyticsSummaryResponse, RiskDistributionResponse, GlobalShapResponse
from app.services.analytics_service import get_analytics_summary, get_risk_distribution
from app.services.prediction_service import get_global_shap

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get analytics summary",
    description="Returns aggregate key performance metrics calculated dynamically from stored transactions."
)
def summary(db: Session = Depends(get_db)):
    return get_analytics_summary(db)


@router.get(
    "/risk-distribution",
    response_model=RiskDistributionResponse,
    summary="Get risk level distribution",
    description="Returns count of transactions grouped into Low, Medium, and High risk bands."
)
def risk_distribution(db: Session = Depends(get_db)):
    return get_risk_distribution(db)


@router.get(
    "/global-shap",
    response_model=GlobalShapResponse,
    summary="Get global SHAP feature importance",
    description="Returns model-wide feature importance ranking based on TreeSHAP and gain metrics."
)
def global_shap():
    return get_global_shap()

