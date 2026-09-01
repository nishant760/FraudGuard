from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalyticsSummaryResponse, RiskDistributionResponse
from app.services.analytics_service import get_analytics_summary, get_risk_distribution

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
