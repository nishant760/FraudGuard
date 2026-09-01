"""
Analytics Service Module
------------------------
Calculates aggregate fraud and risk metrics dynamically from SQLite database.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Transaction


def get_analytics_summary(db: Session) -> Dict[str, Any]:
    """
    Computes overall summary metrics for the analytics dashboard:
    - total_transactions
    - total_fraud
    - total_legitimate
    - fraud_rate (ratio 0.0 - 1.0)
    - avg_risk_score
    - avg_transaction_amount
    """
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
    total_fraud = db.query(func.count(Transaction.id)).filter(Transaction.prediction == 1).scalar() or 0
    total_legitimate = total_transactions - total_fraud
    
    avg_risk = db.query(func.avg(Transaction.risk_score)).scalar()
    avg_amount = db.query(func.avg(Transaction.transaction_amount)).scalar()

    avg_risk_score = round(float(avg_risk), 2) if avg_risk is not None else 0.0
    avg_transaction_amount = round(float(avg_amount), 2) if avg_amount is not None else 0.0
    
    fraud_rate = (total_fraud / total_transactions) if total_transactions > 0 else 0.0

    return {
        "total_transactions": total_transactions,
        "total_fraud": total_fraud,
        "total_legitimate": total_legitimate,
        "fraud_rate": fraud_rate,
        "avg_risk_score": avg_risk_score,
        "avg_transaction_amount": avg_transaction_amount
    }


def get_risk_distribution(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    """
    Computes the count of transactions classified in each risk level band:
    - LOW (0-30)
    - MEDIUM (31-70)
    - HIGH (71-100)
    
    Returns frontend expected format:
    {"distribution": [{"risk_level": "LOW", "count": N, "percentage": P}, ...]}
    """
    total = db.query(func.count(Transaction.id)).scalar() or 0
    
    low_count = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "LOW").scalar() or 0
    medium_count = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "MEDIUM").scalar() or 0
    high_count = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "HIGH").scalar() or 0

    return {
        "distribution": [
            {
                "risk_level": "LOW", 
                "count": low_count, 
                "percentage": round((low_count / total * 100), 2) if total > 0 else 0.0
            },
            {
                "risk_level": "MEDIUM", 
                "count": medium_count, 
                "percentage": round((medium_count / total * 100), 2) if total > 0 else 0.0
            },
            {
                "risk_level": "HIGH", 
                "count": high_count, 
                "percentage": round((high_count / total * 100), 2) if total > 0 else 0.0
            }
        ]
    }
