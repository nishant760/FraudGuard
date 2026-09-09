"""
Prediction Service Module
-------------------------
Integrates the actual ML pipeline with the FastAPI backend.
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Dynamically add the ml/ directory to sys.path
# This allows us to import the ML modules without turning them into a package
ML_DIR = Path(__file__).resolve().parent.parent.parent.parent / "ml"
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

# Now we can import the prediction and SHAP functions directly from ml/predict.py
from predict import predict_transaction as ml_predict, get_global_shap_importance as ml_global_shap


def predict_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run prediction on incoming transaction data using the real ML pipeline with TreeSHAP.

    Args:
        data: Dictionary of transaction features (e.g. TransactionAmt, ProductCD, etc.)

    Returns:
        Dictionary containing:
        - prediction (0 | 1)
        - prediction_label ('Legitimate' | 'Fraud')
        - fraud_probability (0.00 to 1.00)
        - risk_score (0 to 100)
        - risk_level ('LOW' | 'MEDIUM' | 'HIGH')
        - model_used ('XGBoost')
        - shap_explanation (dict with TreeSHAP breakdown)
    """
    # Call the ML pipeline
    # The pipeline internally handles loading the model, preprocessing, and TreeSHAP attribution
    ml_result = ml_predict(data)

    # ml_result contains: prediction, fraud_probability, risk_score, risk_level, shap_explanation
    prediction = ml_result["prediction"]
    
    return {
        "prediction": prediction,
        "prediction_label": "Fraud" if prediction == 1 else "Legitimate",
        "fraud_probability": ml_result["fraud_probability"],
        "risk_score": ml_result["risk_score"],
        "risk_level": ml_result["risk_level"],
        "model_used": "XGBoost",
        "explanation": ml_result.get("explanation"),
        "shap_explanation": ml_result.get("shap_explanation")
    }


def get_global_shap() -> Dict[str, Any]:
    """Fetches global feature importance from the ML model."""
    features = ml_global_shap()
    return {"features": features}

