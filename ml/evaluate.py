"""
evaluate.py
===========
Phase 3: Evaluate both trained models on the held-out test set.

Run after train.py has been executed.

Prints:
  - Classification report (Precision, Recall, F1 for each class)
  - ROC-AUC score
  - Confusion matrix
  - Side-by-side comparison table
  - Selects and saves the better model

Why not just use accuracy?
  The dataset is 96.5% legitimate. A model that predicts 'not fraud' for
  every transaction gets 96.5% accuracy but catches ZERO frauds. Precision,
  Recall, F1, and ROC-AUC give a much more honest picture.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
)

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE         = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(os.path.dirname(_HERE), "data", "processed")
MODELS_DIR    = os.path.join(_HERE, "models")

LR_MODEL_PATH   = os.path.join(MODELS_DIR, "logistic_regression.joblib")
XGB_MODEL_PATH  = os.path.join(MODELS_DIR, "xgboost_model.joblib")
SELECTED_MODEL  = os.path.join(MODELS_DIR, "selected_model.joblib")
SELECTED_PREP   = os.path.join(MODELS_DIR, "selected_preprocessor.joblib")
PREPROCESSOR    = os.path.join(MODELS_DIR, "preprocessor.joblib")

SEP = "=" * 65


# ── Load test data and models ──────────────────────────────────────────────────
def load_artifacts():
    X_test  = np.load(os.path.join(PROCESSED_DIR, "X_test.npy"))
    y_test  = pd.read_csv(os.path.join(PROCESSED_DIR, "y_test.csv")).squeeze()
    lr_model  = joblib.load(LR_MODEL_PATH)
    xgb_model = joblib.load(XGB_MODEL_PATH)
    print(f"X_test shape : {X_test.shape}")
    print(f"y_test fraud rate: {y_test.mean()*100:.2f}%  ({y_test.sum()} fraud / {len(y_test)} total)")
    return X_test, y_test, lr_model, xgb_model


# ── Evaluate one model ─────────────────────────────────────────────────────────
def evaluate_model(model, X_test, y_test, model_name):
    """
    Compute all evaluation metrics for one model.
    pos_label=1 means class 1 (Fraud) is the positive class.
    """
    print(f"\n{SEP}")
    print(f"  {model_name}")
    print(SEP)

    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]  # probability of fraud

    # Classification report shows precision/recall/f1 for both classes
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"], digits=4))

    # Confusion matrix: rows = actual, columns = predicted
    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix (rows=Actual, cols=Predicted):")
    print(f"                 Predicted Legit  Predicted Fraud")
    print(f"  Actual Legit       {cm[0][0]:>8}         {cm[0][1]:>8}")
    print(f"  Actual Fraud       {cm[1][0]:>8}         {cm[1][1]:>8}")
    tn, fp, fn, tp = cm.ravel()
    print(f"\n  True Negatives  (TN): {tn:,}  — legit correctly identified")
    print(f"  False Positives (FP): {fp:,}  — legit wrongly flagged as fraud")
    print(f"  False Negatives (FN): {fn:,}  — fraud MISSED by the model")
    print(f"  True Positives  (TP): {tp:,}  — fraud correctly caught")

    # Core metrics
    precision = precision_score(y_test, y_pred, pos_label=1, zero_division=0)
    recall    = recall_score(   y_test, y_pred, pos_label=1, zero_division=0)
    f1        = f1_score(       y_test, y_pred, pos_label=1, zero_division=0)
    roc_auc   = roc_auc_score(  y_test, y_proba)
    accuracy  = (y_pred == y_test).mean()

    print(f"\nSummary metrics (Fraud class):")
    print(f"  Precision : {precision:.4f}  (of all predicted fraud, how many are actually fraud?)")
    print(f"  Recall    : {recall:.4f}  (of all actual fraud, how many did we catch?)")
    print(f"  F1-score  : {f1:.4f}  (harmonic mean of precision and recall)")
    print(f"  ROC-AUC   : {roc_auc:.4f}  (overall discrimination ability, 0.5=random, 1.0=perfect)")
    print(f"  Accuracy  : {accuracy:.4f}  (supplementary only — misleading with 96.5% class imbalance)")

    return {"Model": model_name, "Precision": round(precision, 4),
            "Recall": round(recall, 4), "F1-score": round(f1, 4),
            "ROC-AUC": round(roc_auc, 4), "Accuracy": round(accuracy, 4)}


# ── Comparison table ───────────────────────────────────────────────────────────
def print_comparison_table(lr_metrics, xgb_metrics):
    print(f"\n{SEP}")
    print("  MODEL COMPARISON TABLE")
    print(SEP)
    df = pd.DataFrame([lr_metrics, xgb_metrics])
    df = df.set_index("Model")
    print(df.to_string())
    print()
    print("Primary metrics for fraud detection: Recall, F1-score, ROC-AUC")
    print("(Catching as many fraudulent transactions as possible is the goal,")
    print(" so Recall is especially important — every missed fraud is a real loss.)")


# ── Select better model ────────────────────────────────────────────────────────
def select_and_save_winner(lr_metrics, xgb_metrics, lr_model, xgb_model):
    """
    Select the better model based on ROC-AUC as the primary criterion,
    then F1-score as a tiebreaker.
    Saves the winner as selected_model.joblib and selected_preprocessor.joblib.
    """
    print(f"\n{SEP}")
    print("  MODEL SELECTION")
    print(SEP)

    lr_score  = lr_metrics["ROC-AUC"]
    xgb_score = xgb_metrics["ROC-AUC"]

    if xgb_score >= lr_score:
        winner_model   = xgb_model
        winner_name    = "XGBoost"
        winner_metrics = xgb_metrics
    else:
        winner_model   = lr_model
        winner_name    = "Logistic Regression"
        winner_metrics = lr_metrics

    print(f"  Winner: {winner_name}")
    print(f"  ROC-AUC: LR={lr_score:.4f}  XGB={xgb_score:.4f}")
    print(f"  Selected based on: higher ROC-AUC (overall discrimination ability)")

    joblib.dump(winner_model, SELECTED_MODEL)
    # Copy the preprocessor as the selected one (both models share it)
    preprocessor = joblib.load(PREPROCESSOR)
    joblib.dump(preprocessor, SELECTED_PREP)

    print(f"\n  Saved: selected_model.joblib       → {SELECTED_MODEL}")
    print(f"  Saved: selected_preprocessor.joblib → {SELECTED_PREP}")
    return winner_name, winner_metrics


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print(SEP)
    print("  EVALUATION — IEEE-CIS Fraud Detection")
    print(SEP)

    X_test, y_test, lr_model, xgb_model = load_artifacts()

    lr_metrics  = evaluate_model(lr_model,  X_test, y_test, "Logistic Regression")
    xgb_metrics = evaluate_model(xgb_model, X_test, y_test, "XGBoost")

    print_comparison_table(lr_metrics, xgb_metrics)
    winner_name, winner_metrics = select_and_save_winner(
        lr_metrics, xgb_metrics, lr_model, xgb_model
    )

    print(f"\n[DONE] evaluate.py complete.")
    print(f"       Selected model: {winner_name}")
    print(f"       Use predict.py to run inference with the selected model.")


if __name__ == "__main__":
    main()
