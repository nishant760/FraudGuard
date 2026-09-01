from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class Transaction(Base):
    """
    SQLAlchemy ORM model representing analyzed transactions stored in the database.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    transaction_amount = Column(Float, nullable=False)
    product_category = Column(String(50), nullable=True) # Mapped from ProductCD
    card4 = Column(String(50), nullable=True)
    card6 = Column(String(50), nullable=True)
    prediction = Column(Integer, nullable=False)             # 0 or 1
    prediction_label = Column(String(20), nullable=False)    # 'Fraud' or 'Legitimate'
    fraud_probability = Column(Float, nullable=False)        # 0.00 to 1.00
    risk_score = Column(Integer, nullable=False)             # 0 to 100
    risk_level = Column(String(20), nullable=False)          # 'LOW', 'MEDIUM', 'HIGH'
    model_used = Column(String(50), nullable=False)          # e.g., 'XGBoost'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
