"""
predict.py
==========
Inference module: accepts one raw transaction as a Python dict and returns
a fraud prediction, probability, risk score, risk level, and SHAP explanation.
"""

import os
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib
import shap
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

_model        = None
_preprocessor = None
_explainer    = None

# ── Feature Groups for SHAP Aggregation ───────────────────────────────────────
FEATURE_GROUPS = [
    {"label": "Transaction Amount", "columns": ["num__TransactionAmt", "num__amt_log"]},
    {"label": "Transaction Time of Day", "columns": ["num__tx_hour", "num__tx_day"]},
    {"label": "Card Account Tier", "columns": ["num__card1"]},
    {"label": "Issuing Bank", "columns": ["num__card2"]},
    {"label": "Billing Region", "columns": ["num__addr1"]},
    {"label": "Addresses Linked to Card", "columns": ["num__C1"]},
    {"label": "Recent Transaction Velocity", "columns": ["num__C5"]},
    {"label": "Product / Service Type", "columns": ["cat__ProductCD_C", "cat__ProductCD_H", "cat__ProductCD_R", "cat__ProductCD_S", "cat__ProductCD_W"]},
    {"label": "Card Network", "columns": ["cat__card4_american express", "cat__card4_discover", "cat__card4_mastercard", "cat__card4_missing", "cat__card4_visa"]},
    {"label": "Card Type", "columns": ["cat__card6_charge card", "cat__card6_credit", "cat__card6_debit", "cat__card6_debit or credit", "cat__card6_missing"]},
    {"label": "Email Provider", "columns": ["cat__P_emaildomain_anonymous", "cat__P_emaildomain_gmail", "cat__P_emaildomain_microsoft", "cat__P_emaildomain_missing", "cat__P_emaildomain_other", "cat__P_emaildomain_yahoo"]},
    {"label": "Identity Verified", "columns": ["bin__id_present"]}
]


def _load_artifacts():
    """Load model, preprocessor, and initialize SHAP TreeExplainer exactly once."""
    global _model, _preprocessor, _explainer
    if _model is None:
        _model        = joblib.load(SELECTED_MODEL_PATH)
        _preprocessor = joblib.load(SELECTED_PREP_PATH)
        _explainer    = shap.TreeExplainer(_model)
        print(f"[predict.py] Model loaded: {SELECTED_MODEL_PATH}")
        print(f"[predict.py] Preprocessor loaded: {SELECTED_PREP_PATH}")
        print(f"[predict.py] SHAP TreeExplainer initialized.")


# ── Feature engineering for a single transaction ──────────────────────────────
def _engineer_single(transaction: dict) -> pd.DataFrame:
    """
    Apply the same feature engineering steps used during training
    to a single raw transaction dict.
    """
    row = dict(transaction)

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

    # Ensure all expected features are present in the row dictionary
    all_features = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES
    for col in NUMERIC_FEATURES:
        if col not in row:
            row[col] = np.nan
    for col in CATEGORICAL_FEATURES:
        if col not in row:
            row[col] = None
    for col in BINARY_FEATURES:
        if col not in row:
            row[col] = 0

    df_row = pd.DataFrame([row])[all_features]
    return df_row


def _build_explanation(shap_values: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
    """
    Sums SHAP values per group. Separates them into top_risk_factors (positive SHAP,
    sort descending) and top_protective_factors (negative SHAP, sort ascending).
    Caps at 3 each. Calculates relative_impact (0.0 to 1.0) by dividing by maximum
    absolute magnitude within that specific list.
    """
    feat_idx_map = {name: idx for idx, name in enumerate(feature_names)}

    risk_list = []
    prot_list = []

    for group in FEATURE_GROUPS:
        label = group["label"]
        columns = group["columns"]

        group_shap = sum(
            float(shap_values[feat_idx_map[col]])
            for col in columns
            if col in feat_idx_map
        )

        if abs(group_shap) < 1e-5:
            continue

        if group_shap > 0:
            risk_list.append({
                "feature": label,
                "direction": "increases_risk",
                "shap": group_shap
            })
        else:
            prot_list.append({
                "feature": label,
                "direction": "reduces_risk",
                "shap": group_shap
            })

    # Sort risk factors descending by positive SHAP value, cap at 3
    risk_list.sort(key=lambda x: x["shap"], reverse=True)
    top_risk_factors = risk_list[:3]

    if top_risk_factors:
        max_risk = top_risk_factors[0]["shap"]
        for item in top_risk_factors:
            item["relative_impact"] = round(item["shap"] / max_risk, 4) if max_risk > 0 else 1.0
            del item["shap"]

    # Sort protective factors ascending (most negative first), cap at 3
    prot_list.sort(key=lambda x: x["shap"])
    top_protective_factors = prot_list[:3]

    if top_protective_factors:
        max_prot = abs(top_protective_factors[0]["shap"])
        for item in top_protective_factors:
            item["relative_impact"] = round(abs(item["shap"]) / max_prot, 4) if max_prot > 0 else 1.0
            del item["shap"]

    return {
        "available": True,
        "top_risk_factors": top_risk_factors,
        "top_protective_factors": top_protective_factors,
        "error": None
    }


# ── Public prediction function with Explainable AI (SHAP) ─────────────────────
def predict_transaction(transaction: dict) -> dict:
    """
    Accept one raw transaction dict and return a prediction with SHAP explanations.
    """
    _load_artifacts()

    # Apply feature engineering to get a single-row DataFrame
    df_row = _engineer_single(transaction)

    # Apply the SAME preprocessing used during training
    X_proc = _preprocessor.transform(df_row)
    feature_names = list(_preprocessor.get_feature_names_out())

    # Predict
    prediction        = int(_model.predict(X_proc)[0])
    fraud_probability = float(_model.predict_proba(X_proc)[0, 1])

    # Risk score mapping
    risk = compute_risk(fraud_probability)

    # Compute SHAP explanation
    try:
        raw_shap = _explainer.shap_values(X_proc)
        if isinstance(raw_shap, list):
            shap_vec = raw_shap[1][0] if len(raw_shap) > 1 else raw_shap[0][0]
        elif hasattr(raw_shap, "values"):
            shap_vec = raw_shap.values[0]
        else:
            shap_vec = raw_shap[0] if len(raw_shap.shape) > 1 else raw_shap

        explanation = _build_explanation(shap_vec, feature_names)
    except Exception as e:
        print(f"[predict.py] SHAP explanation error: {e}")
        explanation = {
            "available": False,
            "top_risk_factors": None,
            "top_protective_factors": None,
            "error": str(e)
        }

    return {
        "prediction":        prediction,
        "fraud_probability": round(fraud_probability, 4),
        "risk_score":        risk["risk_score"],
        "risk_level":        risk["risk_level"],
        "explanation":       explanation,
    }


if __name__ == "__main__":
    sample_transaction = {
        "TransactionAmt": 2500.00,
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

    print("\nRunning prediction with SHAP...")
    res = predict_transaction(sample_transaction)
    print("Result:", res)


def get_global_shap_importance() -> List[Dict[str, Any]]:
    """Returns global feature importance ranked by mean feature impact from the trained XGBoost model."""
    _load_artifacts()
    feature_names = list(_preprocessor.get_feature_names_out())
    booster = _model.get_booster()
    score_dict = booster.get_score(importance_type="gain")
    total_gain = sum(score_dict.values()) or 1.0

    global_items = []
    for idx, fname in enumerate(feature_names):
        key = f"f{idx}"
        gain = float(score_dict.get(key, score_dict.get(fname, 0.0)))
        pct = round((gain / total_gain) * 100, 2)
        global_items.append({
            "feature": fname,
            "display_name": fname.replace("num__", "").replace("cat__", "").replace("bin__", "").title(),
            "category": "Feature",
            "importance_score": round(gain, 2),
            "importance_pct": pct,
        })

    global_items.sort(key=lambda x: x["importance_score"], reverse=True)
    return global_items
