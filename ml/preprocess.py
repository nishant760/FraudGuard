"""
preprocess.py
=============
Phase 1: Load raw IEEE-CIS data, engineer features, split, and fit preprocessing.

This file does everything needed to go from raw CSV files to model-ready
numerical arrays. It also saves the fitted preprocessor so that the same
transformations can be applied later during inference (in predict.py).

Run this file first, before train.py.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE         = os.path.dirname(os.path.abspath(__file__))
ROOT          = os.path.dirname(_HERE)
RAW_DIR       = os.path.join(ROOT, "data", "raw")
PROCESSED_DIR = os.path.join(ROOT, "data", "processed")
MODELS_DIR    = os.path.join(_HERE, "models")

TXN_PATH          = os.path.join(RAW_DIR, "train_transaction.csv")
IDN_PATH          = os.path.join(RAW_DIR, "train_identity.csv")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR,    exist_ok=True)

TARGET = "isFraud"

# ── Feature groups ─────────────────────────────────────────────────────────────
# These are the 14 source features selected after Phase 0 inspection.
# See phase0_inspection_report for the full justification for each decision.

NUMERIC_FEATURES = [
    "TransactionAmt",  # Raw transaction amount — primary fraud signal
    "amt_log",         # log1p(TransactionAmt) — reduces right skew (engineered)
    "tx_hour",         # Hour of day 0-23 (engineered from TransactionDT)
    "tx_day",          # Day of week 0-6  (engineered from TransactionDT)
    "card1",           # Numeric card identifier
    "card2",           # Card sub-attribute
    "addr1",           # Billing address region (~47% missing, imputed with median)
    "C1",              # Count of billing addresses per card (0% missing)
    "C5",              # Count-type feature from Vesta (0% missing)
]

CATEGORICAL_FEATURES = [
    "ProductCD",       # Product category: W, H, C, S, R  (5 values, 0% missing)
    "card4",           # Card network: visa/mastercard/amex/discover (4 values)
    "card6",           # Card type: debit/credit (4 values)
    "P_emaildomain",   # Purchaser email — coarsened from 59 to 6 groups
]

BINARY_FEATURES = [
    "id_present",      # 1 if identity record exists, 0 otherwise
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES


# ── Step A: Email domain coarsening ───────────────────────────────────────────
def coarsen_email_domain(series):
    """
    Maps 59 unique email domain values into 6 interpretable groups.
    This is done before the train/test split because it is a fixed
    deterministic mapping — it does not learn any statistics from the data.
    """
    def _map(value):
        if pd.isnull(value):
            return "missing"
        v = str(value).lower()
        if "gmail"    in v: return "gmail"
        if "yahoo"    in v: return "yahoo"
        if "hotmail"  in v or "outlook" in v or "live" in v: return "microsoft"
        if "anonymous" in v: return "anonymous"
        return "other"
    return series.map(_map)


# ── Step B: Load data and engineer features ────────────────────────────────────
def load_and_engineer(txn_path=TXN_PATH, idn_path=IDN_PATH):
    """
    Loads the raw CSVs and creates all engineered features.

    Feature engineering DOES NOT use isFraud, so it is safe to do
    before the train/test split. No statistics are learned here —
    these are purely arithmetic transformations.
    """
    print("[1] Loading train_transaction.csv ...")
    txn = pd.read_csv(txn_path)
    print(f"    Shape: {txn.shape[0]:,} rows x {txn.shape[1]} columns")

    # Load only the TransactionID column from identity file.
    # We only need to know which transactions HAVE an identity record.
    print("[2] Loading train_identity.csv (TransactionID only) ...")
    idn = pd.read_csv(idn_path, usecols=["TransactionID"])
    idn_ids = set(idn["TransactionID"])
    print(f"    Identity records: {len(idn_ids):,}")

    # id_present: binary flag — does this transaction have an identity record?
    # 75.6% of transactions do NOT have one, so this absence itself is a signal.
    txn["id_present"] = txn["TransactionID"].isin(idn_ids).astype(int)
    print(f"    id_present=1 (has identity): {txn['id_present'].sum():,}")
    print(f"    id_present=0 (no identity) : {(txn['id_present']==0).sum():,}")

    # Time features from TransactionDT (elapsed seconds from reference date)
    txn["tx_hour"] = (txn["TransactionDT"] // 3600) % 24
    txn["tx_day"]  = (txn["TransactionDT"] // 86400) % 7

    # Log transform: fraud and legit amounts have very different scales.
    # log1p(x) = log(1+x), which safely handles x=0.
    txn["amt_log"] = np.log1p(txn["TransactionAmt"])

    # Coarsen email domain (59 values → 6 groups)
    txn["P_emaildomain"] = coarsen_email_domain(txn["P_emaildomain"])

    return txn


# ── Step C: Select final features ─────────────────────────────────────────────
def select_features(df):
    """Keeps only the 14 selected features and the target. Drops everything else."""
    available = [c for c in ALL_FEATURES if c in df.columns]
    missing   = [c for c in ALL_FEATURES if c not in df.columns]
    if missing:
        print(f"[WARN] Expected features not found in data: {missing}")

    X = df[available].copy()
    y = df[TARGET].copy()

    print(f"\n[3] Features selected: {len(available)}")
    print(f"    Numeric     ({len(NUMERIC_FEATURES)}): {NUMERIC_FEATURES}")
    print(f"    Categorical ({len(CATEGORICAL_FEATURES)}): {CATEGORICAL_FEATURES}")
    print(f"    Binary      ({len(BINARY_FEATURES)}): {BINARY_FEATURES}")
    print(f"    Target distribution: {y.value_counts().to_dict()}")
    print(f"    Fraud rate: {y.mean()*100:.2f}%")
    return X, y


# ── Step D: Build the preprocessing pipeline ──────────────────────────────────
def build_preprocessor():
    """
    Returns an UNFITTED sklearn ColumnTransformer.

    It applies three separate pipelines to three groups of columns:
      - Numeric:      median imputation → StandardScaler
      - Categorical:  fill NaN with 'missing' → OneHotEncoder
      - Binary:       pass through unchanged (id_present is already 0/1)

    This object must be fitted ONLY on training data (see run_pipeline below).
    The fitted object is then saved and reused at inference time.
    """
    # Numeric: fill NaN with the column median, then scale to mean=0 std=1
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])

    # Categorical: fill NaN with string 'missing', then one-hot encode
    # handle_unknown='ignore' means unseen categories at inference → all zeros
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer([
        ("num", numeric_pipeline,    NUMERIC_FEATURES),
        ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ("bin", "passthrough",        BINARY_FEATURES),
    ])

    return preprocessor


# ── Step E: Full pipeline (called from command line) ──────────────────────────
def run_pipeline():
    """
    Runs the complete preprocessing pipeline in the correct order:
      1. Load data and engineer features
      2. Select the 14 features
      3. Split into train (80%) and test (20%)   ← split happens HERE
      4. Fit the preprocessor on training data ONLY
      5. Transform both training and test data
      6. Save the preprocessor and processed arrays to disk
    """
    df = load_and_engineer()
    X, y = select_features(df)

    # ── Train/Test Split ──────────────────────────────────────────────────────
    # Split BEFORE fitting the preprocessor.
    # stratify=y ensures both splits have the same fraud rate (~3.5%).
    print("\n[4] Splitting data: 80% train / 20% test ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        stratify=y,
        random_state=42,
    )
    print(f"    Training set : {X_train.shape[0]:,} rows  (fraud rate: {y_train.mean()*100:.2f}%)")
    print(f"    Test set     : {X_test.shape[0]:,}  rows  (fraud rate: {y_test.mean()*100:.2f}%)")

    # ── Fit Preprocessor on Training Data ONLY ────────────────────────────────
    # fit_transform on X_train: learns median, category vocab, mean/std from train.
    # transform on X_test:      applies those already-learned values (no re-learning).
    print("\n[5] Fitting preprocessor on training data ...")
    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc  = preprocessor.transform(X_test)
    print(f"    X_train after encoding: {X_train_proc.shape}")
    print(f"    X_test  after encoding: {X_test_proc.shape}")
    print("    (Categorical features were one-hot encoded, expanding column count)")

    # ── Save Artifacts ────────────────────────────────────────────────────────
    print("\n[6] Saving preprocessor and processed splits ...")
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    np.save(os.path.join(PROCESSED_DIR, "X_train.npy"), X_train_proc)
    np.save(os.path.join(PROCESSED_DIR, "X_test.npy"),  X_test_proc)
    y_train.reset_index(drop=True).to_csv(os.path.join(PROCESSED_DIR, "y_train.csv"), index=False)
    y_test.reset_index(drop=True).to_csv( os.path.join(PROCESSED_DIR, "y_test.csv"),  index=False)
    print(f"    preprocessor.joblib → {PREPROCESSOR_PATH}")
    print(f"    X_train.npy, X_test.npy, y_train.csv, y_test.csv → {PROCESSED_DIR}")

    print("\n[DONE] preprocess.py complete. Run train.py next.")
    return X_train_proc, X_test_proc, y_train, y_test, preprocessor


if __name__ == "__main__":
    run_pipeline()
