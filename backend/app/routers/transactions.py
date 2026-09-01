from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Transaction
from app.schemas import TransactionHistoryResponse, TransactionDetailResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "",
    response_model=List[TransactionHistoryResponse],
    summary="Get transaction history",
    description="Returns previously analyzed transactions sorted with the most recent first, with optional filters for risk_level and prediction."
)
def get_transactions(
    risk_level: Optional[str] = Query(None, description="Filter by risk level ('LOW', 'MEDIUM', 'HIGH')"),
    prediction: Optional[int] = Query(None, description="Filter by prediction (0=Legitimate, 1=Fraud)"),
    limit: int = Query(50, ge=1, le=500, description="Max number of records to return"),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if risk_level:
        query = query.filter(Transaction.risk_level.ilike(risk_level))
    if prediction is not None:
        query = query.filter(Transaction.prediction == prediction)

    transactions = query.order_by(Transaction.created_at.desc()).limit(limit).all()
    # map product_category to ProductCD for frontend compatibility
    for t in transactions:
        t.ProductCD = t.product_category
    return transactions


@router.get(
    "/{transaction_id}",
    response_model=TransactionDetailResponse,
    summary="Get transaction details",
    description="Fetches full details for a single transaction by its unique transaction ID."
)
def get_transaction_detail(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction
