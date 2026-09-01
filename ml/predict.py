"""
predict.py
==========
Inference module: accepts one raw transaction as a Python dict and returns
a fraud prediction, probability, risk score, and risk level.

This is the file that the FastAPI backend will call.

It loads:
  - selected_preprocessor.joblib  (fitted ColumnTransformer from preprocess.py)
  - selected_model.joblib         (the winning model from evaluate.py)

Both must exist before this file can be used. Run:
  python preprocess.py
  python train.py
  python evaluate.py
...in that order first.
"""

import os
import numpy as np
import pandas as pd
import joblib
from preprocess import (
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    BINARY_FEATURES,
    coarsen_email_domain,
)
from risk_score import compute_risk

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE      = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(_HERE, "models")

SELECTED_MODEL_PATH = os.path.join(MODELS_DIR, "selected_model.joblib")
SELECTED_PREP_PATH  = os.path.join(MODELS_DIR, "selected_preprocessor.joblib")

# Load model and preprocessor once at module import time.
# This means they are loaded once when the server starts, not per request.
_model        = None
_preprocessor = None


def _load_artifacts():
    """Load model and preprocessor from disk (called on first prediction)."""
    global _model, _preprocessor
    if _model is None:
        _model        = joblib.load(SELECTED_MODEL_PATH)
        _preprocessor = joblib.load(SELECTED_PREP_PATH)
        print(f"[predict.py] Model loaded: {SELECTED_MODEL_PATH}")
        print(f"[predict.py] Preprocessor loaded: {SELECTED_PREP_PATH}")


# ── Feature engineering for a single transaction ──────────────────────────────
def _engineer_single(transaction: dict) -> pd.DataFrame:
    """
    Apply the same feature engineering steps used during training
    to a single raw transaction dict.

    The transaction dict should contain the raw column values exactly
    as they appear in the original CSV (e.g., TransactionAmt, TransactionDT).
    """
    row = dict(transaction)  # copy so we don't modify the caller's dict

    # Time features
    dt = row.get("TransactionDT", 0)
    row["tx_hour"] = int((dt // 3600) % 24)
    row["tx_day"]  = int((dt // 86400) % 7)

    # Log amount
    amt = row.get("TransactionAmt", 0.0)
    row["amt_log"] = float(np.log1p(amt))

    # Email domain coarsening
    raw_domain = row.get("P_emaildomain", None)
    row["P_emaildomain"] = coarsen_email_domain(pd.Series([raw_domain])).iloc[0]

    # id_present must be passed in by the caller (1 if identity record exists)
    # Default to 0 if not provided (conservative assumption: no identity = unknown)
    if "id_present" not in row:
        row["id_present"] = 0

    # Build a single-row DataFrame with the selected feature columns
    all_features = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES
    df_row = pd.DataFrame([row])[all_features]

    return df_row


# ── Public prediction function ─────────────────────────────────────────────────
def predict_transaction(transaction: dict) -> dict:
    """
    Accept one raw transaction dict and return a prediction.

    Parameters
    ----------
    transaction : dict
        Raw transaction data. Expected keys include at least:
        TransactionAmt, TransactionDT, ProductCD, card1, card2, card4,
        card6, addr1, C1, C5, P_emaildomain, id_present (optional).

    Returns
    -------
    dict with keys:
        prediction       : int    (0 = Legitimate, 1 = Fraud)
        fraud_probability: float  (0.0 to 1.0)
        risk_score       : int    (0 to 100)
        risk_level       : str    ('LOW', 'MEDIUM', or 'HIGH')
    """
    _load_artifacts()

    # Apply feature engineering to get a single-row DataFrame
    df_row = _engineer_single(transaction)

    # Apply the SAME preprocessing used during training
    X_proc = _preprocessor.transform(df_row)

    # Predict
    prediction       = int(_model.predict(X_proc)[0])
    fraud_probability = float(_model.predict_proba(X_proc)[0, 1])

    # Risk score mapping
    risk = compute_risk(fraud_probability)

    return {
        "prediction":        prediction,
        "fraud_probability": round(fraud_probability, 4),
        "risk_score":        risk["risk_score"],
        "risk_level":        risk["risk_level"],
    }


# ── Demo when run directly ─────────────────────────────────────────────────────
if __name__ == "__main__":
    # Example transaction — values are illustrative only
    sample_transaction = {
        "TransactionAmt": 250.00,
        "TransactionDT":  86400,
        "ProductCD":      "W",
        "card1":          9500,
        "card2":          360.0,
        "card4":          "visa",
        "card6":          "debit",
        "addr1":          299.0,
        "C1":             1.0,
        "C5":             0.0,
        "P_emaildomain":  "gmail.com",
        "id_present":     0,
    }

    print("Sample transaction:")
    for k, v in sample_transaction.items():
        print(f"  {k}: {v}")

    print("\nRunning prediction ...")
    result = predict_transaction(sample_transaction)

    print("\nPrediction result:")
    print(f"  prediction        : {result['prediction']}  (0=Legitimate, 1=Fraud)")
    print(f"  fraud_probability : {result['fraud_probability']}")
    print(f"  risk_score        : {result['risk_score']} / 100")
    print(f"  risk_level        : {result['risk_level']}")
