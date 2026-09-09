import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Transaction
from app.schemas import TransactionPredictRequest, TransactionPredictResponse
from app.services.prediction_service import predict_transaction

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=TransactionPredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict transaction fraud and risk",
    description="Validates transaction payload, evaluates fraud risk via prediction service, stores record in database, and returns risk intelligence response."
)
def predict(
    payload: TransactionPredictRequest,
    db: Session = Depends(get_db)
):
    try:
        # Step 1 & 2: Extract data dictionary and pass to prediction service
        input_data = payload.model_dump()
        result = predict_transaction(input_data)

        # Step 3: Generate clean unique transaction ID
        transaction_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"

        # Step 4: Create and persist database record
        db_transaction = Transaction(
            transaction_id=transaction_id,
            transaction_amount=payload.TransactionAmt,
            product_category=payload.ProductCD,
            card4=payload.card4,
            card6=payload.card6,
            prediction=result["prediction"],
            prediction_label=result["prediction_label"],
            fraud_probability=result["fraud_probability"],
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            model_used=result["model_used"]
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)

        # Step 5: Return structured response with SHAP explanation
        return {
            "transaction_id": transaction_id,
            "prediction": result["prediction"],
            "prediction_label": result["prediction_label"],
            "fraud_probability": result["fraud_probability"],
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "model_used": result["model_used"],
            "explanation": result.get("explanation"),
            "shap_explanation": result.get("shap_explanation"),
        }


    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the prediction: {str(e)}"
        )
