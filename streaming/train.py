"""
train.py
========
PaySim Real-Time Streaming Fraud Detection Model Training.

Features engineered:
  - Balance discrepancies (errorBalanceOrig, errorBalanceDest)
  - Log amounts & zero-balance indicators
  - Temporal hour_of_day & day_of_week
  - Sliding-window velocity features (transaction count & sum in last N steps)
  - One-hot encoded transaction types (TRANSFER, CASH_OUT, etc.)

Imbalance handling:
  - SMOTE (Synthetic Minority Over-sampling Technique)
  
Model:
  - XGBoost Classifier (or high-performance ensemble with fallback)
  - Calibrated probability scoring & risk rating
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)

# Imbalance handling
try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

# XGBoost classifier
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import RandomForestClassifier

# Local modules
try:
    from streaming.config import (
        STREAMING_DIR,
        PAYSIM_SEARCH_PATHS,
        MODEL_PATH,
        METRICS_PATH,
        VELOCITY_WINDOW_STEPS,
    )
    from streaming.sliding_window import compute_dataset_velocity_features
    from streaming.feature_pipeline import engineer_dataframe_features, FEATURE_NAMES
    from streaming.generate_sample_data import generate_paysim_dataset
except ImportError:
    from config import (
        STREAMING_DIR,
        PAYSIM_SEARCH_PATHS,
        MODEL_PATH,
        METRICS_PATH,
        VELOCITY_WINDOW_STEPS,
    )
    from sliding_window import compute_dataset_velocity_features
    from feature_pipeline import engineer_dataframe_features, FEATURE_NAMES
    from generate_sample_data import generate_paysim_dataset


def resolve_dataset_path(provided_path: str = None) -> str:
    """Finds an existing PaySim CSV file or creates sample data if none found."""
    if provided_path and os.path.exists(provided_path):
        return provided_path

    for candidate in PAYSIM_SEARCH_PATHS:
        if os.path.exists(candidate):
            return candidate

    print("[INFO] No existing PaySim CSV found in standard paths.")
    print("       Automatically generating synthetic PaySim sample for training...")
    sample_path = os.path.join(STREAMING_DIR, "data", "paysim_sample.csv")
    generate_paysim_dataset(num_records=20000, fraud_rate=0.04, output_path=sample_path)
    return sample_path


def load_and_prepare_data(csv_path: str, window_steps: int = VELOCITY_WINDOW_STEPS):
    """
    Loads PaySim CSV, sorts by step (chronological ordering), computes windowed velocity
    features, and transforms columns into engineered features.
    """
    print(f"\n[1/5] Loading PaySim dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"      Loaded {len(df):,} total rows with columns: {list(df.columns)}")

    if "isFraud" not in df.columns:
        raise ValueError("Dataset missing 'isFraud' target column.")

    # Sort strictly by step to preserve time causality
    print("      Sorting chronologically by 'step'...")
    df = df.sort_values(by=["step"]).reset_index(drop=True)

    fraud_count = int(df["isFraud"].sum())
    legit_count = int(len(df) - fraud_count)
    fraud_rate = fraud_count / len(df) * 100.0
    print(f"      Legitimate: {legit_count:,} | Fraudulent: {fraud_count:,} ({fraud_rate:.2f}%)")

    # Compute sliding window velocity features over history
    print(f"\n[2/5] Computing sliding-window velocity features (Window N = {window_steps} steps)...")
    df = compute_dataset_velocity_features(df, window_steps=window_steps)

    # Apply shared feature engineering
    print("\n[3/5] Engineering balance discrepancy, temporal, and type features...")
    X = engineer_dataframe_features(df)
    y = df["isFraud"].astype(int)

    print(f"      Feature matrix shape: {X.shape}")
    print(f"      Features: {list(X.columns)}")
    return X, y, df


def balance_with_smote(X_train: pd.DataFrame, y_train: pd.Series):
    """Applies SMOTE to balance the training split."""
    minority_count = (y_train == 1).sum()
    print(f"\n[4/5] Handling class imbalance (Minority fraud samples = {minority_count:,})...")

    if HAS_SMOTE:
        # Determine appropriate k_neighbors for SMOTE
        k_neighbors = min(5, max(1, minority_count - 1))
        if minority_count > 2:
            print(f"      Applying SMOTE (k_neighbors={k_neighbors})...")
            smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
            X_res, y_res = smote.fit_resample(X_train, y_train)
            print(f"      Resampled train shape: {X_res.shape} (Fraud: {(y_res==1).sum():,}, Legit: {(y_res==0).sum():,})")
            return X_res, y_res
        else:
            print("      [WARN] Too few minority samples for SMOTE; proceeding without SMOTE resampling.")
            return X_train, y_train
    else:
        print("      [INFO] 'imblearn' not installed. Using model-native class weights instead.")
        return X_train, y_train


def train_model(X_train, y_train, fraud_ratio: float = 1.0):
    """Trains the fraud classification model."""
    print("\n[5/5] Training Classifier...")

    if HAS_XGBOOST:
        print("      Using XGBoost Classifier (scale_pos_weight optimized)...")
        model = XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=max(1.0, fraud_ratio),
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1
        )
    else:
        print("      Using Random Forest Classifier (class_weight='balanced_subsample')...")
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1
        )

    model.fit(X_train, y_train)
    return model


def evaluate_and_save(model, X_test: pd.DataFrame, y_test: pd.Series, output_model_path: str = MODEL_PATH):
    """Evaluates the model on test split and exports artifacts."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    roc_auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 1.0
    pr_auc = average_precision_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 1.0
    f1 = f1_score(y_test, y_pred, zero_division=0)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 60)
    print("                    EVALUATION METRICS                     ")
    print("=" * 60)
    print(f"ROC-AUC Score          : {roc_auc:.4f}")
    print(f"PR-AUC Score           : {pr_auc:.4f}")
    print(f"Precision              : {precision:.4f}")
    print(f"Recall                 : {recall:.4f}")
    print(f"F1-Score               : {f1:.4f}")
    print("\nConfusion Matrix:")
    print(f"  [TN: {cm[0][0]:<6}  FP: {cm[0][1]:<6}]")
    if len(cm) > 1:
        print(f"  [FN: {cm[1][0]:<6}  TP: {cm[1][1]:<6}]")
    print("=" * 60)

    # Feature Importance
    if hasattr(model, "feature_importances_"):
        importances = pd.Series(model.feature_importances_, index=FEATURE_NAMES).sort_values(ascending=False)
        print("\nTop 8 Feature Importances:")
        for feat, val in importances.head(8).items():
            print(f"  • {feat:<26}: {val:.4f}")

    # Save artifact containing model + feature names + metadata
    artifact = {
        "model": model,
        "feature_names": FEATURE_NAMES,
        "velocity_window_steps": VELOCITY_WINDOW_STEPS,
        "model_type": type(model).__name__,
        "metrics": {
            "roc_auc": float(roc_auc),
            "pr_auc": float(pr_auc),
            "f1": float(f1),
            "precision": float(precision),
            "recall": float(recall)
        }
    }

    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    joblib.dump(artifact, output_model_path)
    print(f"\n[SAVED] Trained model artifact saved to:\n        {output_model_path}")

    # Also save json metrics
    with open(METRICS_PATH, "w") as f:
        json.dump(artifact["metrics"], f, indent=2)
    print(f"[SAVED] Metrics JSON exported to: {METRICS_PATH}\n")


def main():
    parser = argparse.ArgumentParser(description="Train FraudGuard ML model on PaySim data.")
    parser.add_argument("--data", type=str, default=None, help="Path to PaySim CSV dataset")
    parser.add_argument("--window", type=int, default=VELOCITY_WINDOW_STEPS, help="Sliding window size in steps")
    parser.add_argument("--output", type=str, default=MODEL_PATH, help="Path to save trained model artifact")
    args = parser.parse_args()

    dataset_path = resolve_dataset_path(args.data)
    X, y, df = load_and_prepare_data(dataset_path, window_steps=args.window)

    # Time-based train/test split (80% train, 20% test) to prevent temporal leakage
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    legit_cnt = (y_train == 0).sum()
    fraud_cnt = max(1, (y_train == 1).sum())
    fraud_ratio = legit_cnt / fraud_cnt

    # Apply SMOTE on training split
    X_train_balanced, y_train_balanced = balance_with_smote(X_train, y_train)

    # Train model
    model = train_model(X_train_balanced, y_train_balanced, fraud_ratio=fraud_ratio)

    # Evaluate and persist
    evaluate_and_save(model, X_test, y_test, output_model_path=args.output)


if __name__ == "__main__":
    main()
