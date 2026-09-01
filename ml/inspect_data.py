"""
inspect_data.py
===============
Phase 0: Read-only inspection of the IEEE-CIS Fraud Detection dataset.
Reports actual statistics. Does NOT modify the raw files.
Does NOT train any model.
"""

import os
import pandas as pd
import numpy as np

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")
TXN_PATH = os.path.join(RAW_DIR, "train_transaction.csv")
IDN_PATH = os.path.join(RAW_DIR, "train_identity.csv")

SEP = "=" * 70

def section(title):
    print(f"\n{SEP}\n  {title}\n{SEP}")

# ── LOAD ──────────────────────────────────────────────────────────────────────
section("LOADING FILES")
txn = pd.read_csv(TXN_PATH)
idn = pd.read_csv(IDN_PATH)
print(f"train_transaction.csv  →  {txn.shape[0]:,} rows  x  {txn.shape[1]} columns")
print(f"train_identity.csv     →  {idn.shape[0]:,} rows  x  {idn.shape[1]} columns")

# ── TRANSACTION TABLE ─────────────────────────────────────────────────────────
section("TRANSACTION TABLE — COLUMN NAMES AND DATA TYPES")
print(txn.dtypes.to_string())

# ── IDENTITY TABLE ────────────────────────────────────────────────────────────
section("IDENTITY TABLE — COLUMN NAMES AND DATA TYPES")
print(idn.dtypes.to_string())

# ── TARGET DISTRIBUTION ───────────────────────────────────────────────────────
section("TARGET: isFraud DISTRIBUTION")
counts = txn["isFraud"].value_counts()
pct    = txn["isFraud"].value_counts(normalize=True) * 100
print(pd.DataFrame({"count": counts, "percent (%)": pct.round(4)}))
print(f"\nFraud rate: {pct[1]:.4f}%")
print(f"Class ratio (legitimate:fraud) = {counts[0]/counts[1]:.1f} : 1")

# ── TRANSACTIONID UNIQUENESS ──────────────────────────────────────────────────
section("TransactionID UNIQUENESS")
n_total  = len(txn)
n_unique = txn["TransactionID"].nunique()
n_dupes  = n_total - n_unique
print(f"Total rows      : {n_total:,}")
print(f"Unique IDs      : {n_unique:,}")
print(f"Duplicate IDs   : {n_dupes}")
print("→ TransactionID is unique per row." if n_dupes == 0 else "→ WARNING: Duplicate TransactionIDs found!")

# ── IDENTITY TABLE COVERAGE ───────────────────────────────────────────────────
section("IDENTITY TABLE COVERAGE")
txn_ids_with_identity = idn["TransactionID"].nunique()
txn_total             = txn["TransactionID"].nunique()
coverage_pct          = txn_ids_with_identity / txn_total * 100
print(f"Transactions with identity record : {txn_ids_with_identity:,}  ({coverage_pct:.1f}%)")
print(f"Transactions WITHOUT identity     : {txn_total - txn_ids_with_identity:,}  ({100 - coverage_pct:.1f}%)")
print("→ A left-join on TransactionID will leave ~{:.0f}% with NaN identity fields.".format(100 - coverage_pct))

# ── MERGE (left join) ─────────────────────────────────────────────────────────
section("MERGED DATAFRAME SHAPE")
df = txn.merge(idn, on="TransactionID", how="left")
print(f"Merged shape: {df.shape[0]:,} rows  x  {df.shape[1]} columns")

# ── isFlaggedFraud LEAKAGE ANALYSIS ──────────────────────────────────────────
section("isFlaggedFraud — LEAKAGE ANALYSIS")
if "isFlaggedFraud" in df.columns:
    print("Column exists in transaction table.")
    print("\nValue counts for isFlaggedFraud:")
    print(df["isFlaggedFraud"].value_counts(dropna=False))
    print("\nCross-tabulation  isFraud vs isFlaggedFraud:")
    cross = pd.crosstab(df["isFraud"], df["isFlaggedFraud"],
                        rownames=["isFraud"], colnames=["isFlaggedFraud"],
                        margins=True)
    print(cross)
    # Compute overlap
    both_1   = ((df["isFraud"] == 1) & (df["isFlaggedFraud"] == 1)).sum()
    flag_not_fraud = ((df["isFraud"] == 0) & (df["isFlaggedFraud"] == 1)).sum()
    fraud_not_flag = ((df["isFraud"] == 1) & (df["isFlaggedFraud"] == 0)).sum()
    print(f"\nisFlaggedFraud=1 AND isFraud=1 (correct flags)   : {both_1}")
    print(f"isFlaggedFraud=1 AND isFraud=0 (false positives) : {flag_not_fraud}")
    print(f"isFlaggedFraud=0 AND isFraud=1 (missed frauds)   : {fraud_not_flag}")
    all_flags = (df["isFlaggedFraud"] == 1).sum()
    print(f"\nTotal isFlaggedFraud=1 : {all_flags}")
    if all_flags > 0:
        print(f"Of all flagged: {both_1/all_flags*100:.1f}% are true fraud")
else:
    print("isFlaggedFraud column NOT found in dataset.")

# ── MISSING VALUE ANALYSIS — TRANSACTION TABLE ────────────────────────────────
section("MISSING VALUES — TRANSACTION TABLE (top 40 columns)")
miss_txn = txn.isnull().sum()
miss_txn_pct = (miss_txn / len(txn) * 100).round(2)
miss_txn_df  = pd.DataFrame({"missing_count": miss_txn, "missing_pct": miss_txn_pct})
miss_txn_df  = miss_txn_df[miss_txn_df["missing_count"] > 0].sort_values("missing_pct", ascending=False)
print(f"Columns with ANY missing: {len(miss_txn_df)} of {txn.shape[1]}")
print(miss_txn_df.head(40).to_string())
over60_txn = miss_txn_df[miss_txn_df["missing_pct"] > 60]
print(f"\nColumns with >60% missing in transaction table: {len(over60_txn)}")
if len(over60_txn) > 0:
    print(over60_txn.index.tolist())

# ── MISSING VALUE ANALYSIS — IDENTITY TABLE ───────────────────────────────────
section("MISSING VALUES — IDENTITY TABLE (top 30 columns)")
miss_idn = idn.isnull().sum()
miss_idn_pct = (miss_idn / len(idn) * 100).round(2)
miss_idn_df  = pd.DataFrame({"missing_count": miss_idn, "missing_pct": miss_idn_pct})
miss_idn_df  = miss_idn_df[miss_idn_df["missing_count"] > 0].sort_values("missing_pct", ascending=False)
print(f"Columns with ANY missing: {len(miss_idn_df)} of {idn.shape[1]}")
print(miss_idn_df.head(30).to_string())

# ── TransactionDT RANGE ───────────────────────────────────────────────────────
section("TransactionDT RANGE")
if "TransactionDT" in txn.columns:
    dt_min = txn["TransactionDT"].min()
    dt_max = txn["TransactionDT"].max()
    print(f"Min TransactionDT : {dt_min:,}  seconds")
    print(f"Max TransactionDT : {dt_max:,}  seconds")
    span_days = (dt_max - dt_min) / 86400
    print(f"Span              : ~{span_days:.0f} days")
    print("→ TransactionDT is elapsed seconds from a reference date (not Unix epoch).")
    print("  We can derive hour-of-day and day-of-week as proxy time features.")

# ── TransactionAmt STATISTICS ─────────────────────────────────────────────────
section("TransactionAmt STATISTICS")
if "TransactionAmt" in txn.columns:
    amt = txn["TransactionAmt"]
    print(f"Min    : {amt.min():.2f}")
    print(f"Max    : {amt.max():.2f}")
    print(f"Mean   : {amt.mean():.2f}")
    print(f"Median : {amt.median():.2f}")
    print(f"Std    : {amt.std():.2f}")
    # By fraud class
    print("\nAmount statistics split by isFraud:")
    print(txn.groupby("isFraud")["TransactionAmt"].describe().round(2))

# ── CATEGORICAL COLUMN CARDINALITY ────────────────────────────────────────────
section("CARDINALITY OF KEY CATEGORICAL COLUMNS (transaction table)")
cat_cols_to_check = [
    "ProductCD", "card4", "card6",
    "P_emaildomain", "R_emaildomain",
    "M1","M2","M3","M4","M5","M6","M7","M8","M9"
]
for col in cat_cols_to_check:
    if col in txn.columns:
        n_unique = txn[col].nunique()
        top5     = txn[col].value_counts().head(5).to_dict()
        miss_pct = txn[col].isnull().mean() * 100
        print(f"  {col:<20}  unique={n_unique:<5}  missing={miss_pct:.1f}%  top5={top5}")

# ── V-FEATURE MISSING SUMMARY ─────────────────────────────────────────────────
section("V-FEATURES (V1-V339) MISSING VALUE SUMMARY")
v_cols = [c for c in txn.columns if c.startswith("V")]
print(f"Total V-columns: {len(v_cols)}")
v_miss = txn[v_cols].isnull().mean() * 100
print("\nMissing % distribution across all V-columns:")
bins = [0, 10, 30, 60, 80, 100]
labels = ["0-10%", "10-30%", "30-60%", "60-80%", "80-100%"]
cut = pd.cut(v_miss, bins=bins, labels=labels, include_lowest=True)
print(cut.value_counts().sort_index())
print("\nV-features with <10% missing (candidates for use):")
low_miss_v = v_miss[v_miss < 10].index.tolist()
print(f"  Count: {len(low_miss_v)}")
print(f"  Columns: {low_miss_v}")

# ── IDENTITY COLUMNS PREVIEW ──────────────────────────────────────────────────
section("IDENTITY TABLE — COLUMN OVERVIEW")
for col in idn.columns:
    if col == "TransactionID":
        continue
    n_unique = idn[col].nunique()
    miss_pct = idn[col].isnull().mean() * 100
    dtype    = idn[col].dtype
    print(f"  {col:<20}  dtype={str(dtype):<10}  unique={n_unique:<6}  missing={miss_pct:.1f}%")

section("INSPECTION COMPLETE")
print("Raw files have NOT been modified.")
print("No model training has occurred.")
