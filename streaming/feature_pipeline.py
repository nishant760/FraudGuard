"""
feature_pipeline.py
===================
Shared feature engineering pipeline for the PaySim streaming fraud detection system.
Guarantees identical feature transformations between offline training and real-time Kafka inference.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Union


# Standard transaction types present in PaySim
SUPPORTED_TYPES = ["TRANSFER", "CASH_OUT", "PAYMENT", "CASH_IN", "DEBIT"]

# Final ordered feature list passed to the ML classifier
FEATURE_NAMES = [
    # Amounts & Discrepancies
    "amount",
    "amt_log",
    "errorBalanceOrig",
    "errorBalanceDest",
    "oldbalanceOrg_zero",
    "newbalanceOrig_zero",
    "oldbalanceDest_zero",
    "newbalanceDest_zero",
    # Temporal (Step-derived)
    "hour_of_day",
    "day_of_week",
    # Origin Account Windowed Velocity
    "orig_txn_count_window",
    "orig_amount_sum_window",
    "orig_amount_avg_window",
    # One-Hot Encoded Transaction Types
    "type_TRANSFER",
    "type_CASH_OUT",
    "type_PAYMENT",
    "type_CASH_IN",
    "type_DEBIT",
    # Destination identifier flag
    "is_merchant_dest",
]


def extract_single_record_features(record: Dict[str, Any], velocity_features: Dict[str, float]) -> pd.DataFrame:
    """
    Transforms a single raw transaction dictionary (from Kafka) into a 1-row model-ready DataFrame.
    
    :param record: Raw dictionary received from Kafka topic (e.g. {'step': 1, 'type': 'TRANSFER', ...})
    :param velocity_features: Dictionary from SlidingWindowTracker ({'orig_txn_count_window': 1.0, ...})
    :return: 1-row pandas DataFrame matching FEATURE_NAMES exactly.
    """
    step = int(record.get("step", 1))
    txn_type = str(record.get("type", "TRANSFER")).upper().strip()
    amount = float(record.get("amount", 0.0))
    oldbalanceOrg = float(record.get("oldbalanceOrg", 0.0))
    newbalanceOrig = float(record.get("newbalanceOrig", 0.0))
    nameDest = str(record.get("nameDest", ""))
    oldbalanceDest = float(record.get("oldbalanceDest", 0.0))
    newbalanceDest = float(record.get("newbalanceDest", 0.0))

    # 1. Balance discrepancy calculations
    # Normal math: newbalanceOrig = oldbalanceOrg - amount -> errorBalanceOrig = (oldbalanceOrg - amount) - newbalanceOrig
    error_balance_orig = (oldbalanceOrg - amount) - newbalanceOrig
    # Normal math: newbalanceDest = oldbalanceDest + amount -> errorBalanceDest = (oldbalanceDest + amount) - newbalanceDest
    error_balance_dest = (oldbalanceDest + amount) - newbalanceDest

    # 2. Temporal derivations
    hour_of_day = step % 24
    day_of_week = (step // 24) % 7

    # 3. Type one-hot encoding
    type_ohe = {f"type_{t}": (1.0 if txn_type == t else 0.0) for t in SUPPORTED_TYPES}

    # 4. Assembling feature dict
    row = {
        "amount": amount,
        "amt_log": float(np.log1p(max(0.0, amount))),
        "errorBalanceOrig": float(error_balance_orig),
        "errorBalanceDest": float(error_balance_dest),
        "oldbalanceOrg_zero": 1.0 if oldbalanceOrg == 0.0 else 0.0,
        "newbalanceOrig_zero": 1.0 if newbalanceOrig == 0.0 else 0.0,
        "oldbalanceDest_zero": 1.0 if oldbalanceDest == 0.0 else 0.0,
        "newbalanceDest_zero": 1.0 if newbalanceDest == 0.0 else 0.0,
        "hour_of_day": float(hour_of_day),
        "day_of_week": float(day_of_week),
        "orig_txn_count_window": float(velocity_features.get("orig_txn_count_window", 1.0)),
        "orig_amount_sum_window": float(velocity_features.get("orig_amount_sum_window", amount)),
        "orig_amount_avg_window": float(velocity_features.get("orig_amount_avg_window", amount)),
        "is_merchant_dest": 1.0 if nameDest.startswith("M") else 0.0,
        **type_ohe,
    }

    # Return DataFrame ensuring column order aligns with FEATURE_NAMES
    return pd.DataFrame([row])[FEATURE_NAMES]


def engineer_dataframe_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms a batch PaySim DataFrame (used during training) into model-ready features.
    Assumes velocity features ('orig_txn_count_window', etc.) are already populated.
    
    :param df: DataFrame with PaySim raw columns and velocity columns.
    :return: Feature DataFrame X matching FEATURE_NAMES.
    """
    df_feat = pd.DataFrame(index=df.index)

    # Amounts and log transforms
    df_feat["amount"] = df["amount"].astype(float)
    df_feat["amt_log"] = np.log1p(np.maximum(0.0, df["amount"].astype(float)))

    # Balance discrepancy features
    old_orig = df["oldbalanceOrg"].astype(float)
    new_orig = df["newbalanceOrig"].astype(float)
    old_dest = df["oldbalanceDest"].astype(float)
    new_dest = df["newbalanceDest"].astype(float)
    amt = df["amount"].astype(float)

    df_feat["errorBalanceOrig"] = (old_orig - amt) - new_orig
    df_feat["errorBalanceDest"] = (old_dest + amt) - new_dest

    # Zero flags
    df_feat["oldbalanceOrg_zero"] = (old_orig == 0.0).astype(float)
    df_feat["newbalanceOrig_zero"] = (new_orig == 0.0).astype(float)
    df_feat["oldbalanceDest_zero"] = (old_dest == 0.0).astype(float)
    df_feat["newbalanceDest_zero"] = (new_dest == 0.0).astype(float)

    # Temporal features derived from step
    step_col = df["step"].astype(int)
    df_feat["hour_of_day"] = (step_col % 24).astype(float)
    df_feat["day_of_week"] = ((step_col // 24) % 7).astype(float)

    # Velocity features (falling back to defaults if not present)
    df_feat["orig_txn_count_window"] = df.get("orig_txn_count_window", pd.Series(1.0, index=df.index)).astype(float)
    df_feat["orig_amount_sum_window"] = df.get("orig_amount_sum_window", df["amount"]).astype(float)
    df_feat["orig_amount_avg_window"] = df.get("orig_amount_avg_window", df["amount"]).astype(float)

    # Transaction Type One-Hot Encoding
    txn_types = df["type"].astype(str).str.upper().str.strip()
    for t in SUPPORTED_TYPES:
        df_feat[f"type_{t}"] = (txn_types == t).astype(float)

    # Destination merchant flag
    if "nameDest" in df.columns:
        df_feat["is_merchant_dest"] = df["nameDest"].astype(str).str.startswith("M").astype(float)
    else:
        df_feat["is_merchant_dest"] = 0.0

    return df_feat[FEATURE_NAMES]
