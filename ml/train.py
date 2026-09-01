"""
train.py
========
Phase 2: Train Logistic Regression and XGBoost on the preprocessed data.

Run after preprocess.py has been executed.

This file:
  - Loads the preprocessed train split (X_train.npy, y_train.csv)
  - Trains a Logistic Regression model
  - Trains an XGBoost model
  - Saves both models to ml/models/
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE         = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(os.path.dirname(_HERE), "data", "processed")
MODELS_DIR    = os.path.join(_HERE, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

LR_MODEL_PATH  = os.path.join(MODELS_DIR, "logistic_regression.joblib")
XGB_MODEL_PATH = os.path.join(MODELS_DIR, "xgboost_model.joblib")


# ── Load preprocessed training data ───────────────────────────────────────────
def load_train_data():
    """Load the preprocessed training arrays saved by preprocess.py."""
    X_train = np.load(os.path.join(PROCESSED_DIR, "X_train.npy"))
    y_train = pd.read_csv(os.path.join(PROCESSED_DIR, "y_train.csv")).squeeze()
    print(f"[LOAD] X_train shape: {X_train.shape}")
    print(f"[LOAD] y_train distribution: {y_train.value_counts().to_dict()}")
    fraud_count  = (y_train == 1).sum()
    legit_count  = (y_train == 0).sum()
    print(f"[LOAD] Fraud rate in training set: {fraud_count/len(y_train)*100:.2f}%")
    print(f"[LOAD] Class ratio (legit:fraud) = {legit_count/fraud_count:.1f} : 1")
    return X_train, y_train, legit_count, fraud_count


# ── Model A: Logistic Regression ──────────────────────────────────────────────
def train_logistic_regression(X_train, y_train):
    """
    Train a Logistic Regression classifier.

    class_weight='balanced': automatically adjusts weights so the model
    treats fraudulent transactions as more important. Without this, the model
    would learn to predict 'not fraud' almost always and get ~96.5% accuracy
    while catching almost no fraud — useless for our purpose.

    max_iter=1000: the optimiser needs enough iterations to converge on this
    dataset size. 100 (the default) is often too few for 470K+ rows.
    """
    print("\n[MODEL A] Training Logistic Regression ...")
    print("    class_weight='balanced' — compensates for 27.6:1 class imbalance")
    print("    max_iter=1000           — enough for convergence on this dataset size")

    lr_model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
        solver="lbfgs",
    )
    lr_model.fit(X_train, y_train)
    print("    Logistic Regression training complete.")
    return lr_model


# ── Model B: XGBoost ──────────────────────────────────────────────────────────
def train_xgboost(X_train, y_train, legit_count, fraud_count):
    """
    Train an XGBoost classifier.

    scale_pos_weight: tells XGBoost how much more to weight the minority class
    (fraud). Computed as: count(legitimate) / count(fraud).
    For our dataset this is approximately 27.6.

    n_estimators=100:  number of trees — modest, trains in practical time.
    max_depth=4:        shallow trees — less overfitting, more generalizable.
    learning_rate=0.1:  standard starting value. Each tree contributes 10%.
    eval_metric='logloss': internal loss function for binary classification.

    We do NOT search for the best hyperparameters. These conservative
    values are chosen to be explainable, not to squeeze out maximum performance.
    """
    scale_pos_weight = legit_count / fraud_count
    print(f"\n[MODEL B] Training XGBoost ...")
    print(f"    scale_pos_weight = {legit_count} / {fraud_count} = {scale_pos_weight:.2f}")
    print(f"    n_estimators=100, max_depth=4, learning_rate=0.1")

    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
        verbosity=0,
    )
    xgb_model.fit(X_train, y_train)
    print("    XGBoost training complete.")
    return xgb_model


# ── Save models ────────────────────────────────────────────────────────────────
def save_models(lr_model, xgb_model):
    """Save both trained models to disk using joblib."""
    joblib.dump(lr_model,  LR_MODEL_PATH)
    joblib.dump(xgb_model, XGB_MODEL_PATH)
    print(f"\n[SAVE] logistic_regression.joblib → {LR_MODEL_PATH}")
    print(f"[SAVE] xgboost_model.joblib       → {XGB_MODEL_PATH}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    X_train, y_train, legit_count, fraud_count = load_train_data()
    lr_model  = train_logistic_regression(X_train, y_train)
    xgb_model = train_xgboost(X_train, y_train, legit_count, fraud_count)
    save_models(lr_model, xgb_model)
    print("\n[DONE] train.py complete. Run evaluate.py next.")


if __name__ == "__main__":
    main()
