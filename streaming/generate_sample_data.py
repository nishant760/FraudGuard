"""
generate_sample_data.py
=======================
Generates a representative sample PaySim dataset with realistic transaction patterns,
balance dynamics, velocity bursts, and fraudulent behavior (transfers & cash-outs).
This allows training and streaming out-of-the-box before downloading the full Kaggle file.
"""

import os
import random
import numpy as np
import pandas as pd
try:
    from streaming.config import DATA_DIR
except ImportError:
    from config import DATA_DIR

DEFAULT_SAMPLE_PATH = os.path.join(DATA_DIR, "paysim_sample.csv")


def generate_paysim_dataset(num_records: int = 15000, fraud_rate: float = 0.05, output_path: str = DEFAULT_SAMPLE_PATH):
    """
    Generates realistic PaySim data conforming to the standard 11-column schema:
    [step, type, amount, nameOrig, oldbalanceOrg, newbalanceOrig, nameDest, oldbalanceDest, newbalanceDest, isFraud, isFlaggedFraud]
    """
    random.seed(42)
    np.random.seed(42)

    records = []
    num_fraud = int(num_records * fraud_rate)
    num_legit = num_records - num_fraud

    customer_pool = [f"C{random.randint(100000000, 999999999)}" for _ in range(3000)]
    merchant_pool = [f"M{random.randint(100000000, 999999999)}" for _ in range(500)]

    print(f"[GENERATE] Generating {num_records:,} PaySim transactions ({num_legit:,} legit, {num_fraud:,} fraud)...")

    # 1. Generate legitimate transactions across 744 steps (30 days)
    for _ in range(num_legit):
        step = random.randint(1, 744)
        txn_type = random.choices(
            ["PAYMENT", "CASH_OUT", "TRANSFER", "CASH_IN", "DEBIT"],
            weights=[0.35, 0.35, 0.15, 0.12, 0.03]
        )[0]

        name_orig = random.choice(customer_pool)
        
        if txn_type == "PAYMENT":
            name_dest = random.choice(merchant_pool)
            amount = round(random.uniform(5.0, 5000.0), 2)
            oldbalance_org = round(random.uniform(amount, amount * 10 + 1000), 2)
            newbalance_orig = round(oldbalance_org - amount, 2)
            oldbalance_dest = 0.0
            newbalance_dest = 0.0
        elif txn_type == "CASH_IN":
            name_dest = random.choice(customer_pool)
            amount = round(random.uniform(50.0, 20000.0), 2)
            oldbalance_org = round(random.uniform(0.0, 50000.0), 2)
            newbalance_orig = round(oldbalance_org + amount, 2)
            oldbalance_dest = round(random.uniform(amount, amount * 5), 2)
            newbalance_dest = round(max(0.0, oldbalance_dest - amount), 2)
        elif txn_type == "CASH_OUT":
            name_dest = random.choice(customer_pool)
            amount = round(random.uniform(100.0, 50000.0), 2)
            oldbalance_org = round(random.uniform(amount, amount * 3), 2)
            newbalance_orig = round(oldbalance_org - amount, 2)
            oldbalance_dest = round(random.uniform(0.0, 100000.0), 2)
            newbalance_dest = round(oldbalance_dest + amount, 2)
        elif txn_type == "TRANSFER":
            name_dest = random.choice(customer_pool)
            amount = round(random.uniform(100.0, 80000.0), 2)
            oldbalance_org = round(random.uniform(amount, amount * 4), 2)
            newbalance_orig = round(oldbalance_org - amount, 2)
            oldbalance_dest = round(random.uniform(0.0, 50000.0), 2)
            newbalance_dest = round(oldbalance_dest + amount, 2)
        else: # DEBIT
            name_dest = random.choice(customer_pool)
            amount = round(random.uniform(10.0, 3000.0), 2)
            oldbalance_org = round(random.uniform(amount, amount * 2), 2)
            newbalance_orig = round(oldbalance_org - amount, 2)
            oldbalance_dest = round(random.uniform(0.0, 10000.0), 2)
            newbalance_dest = round(oldbalance_dest + amount, 2)

        records.append({
            "step": step,
            "type": txn_type,
            "amount": amount,
            "nameOrig": name_orig,
            "oldbalanceOrg": oldbalance_org,
            "newbalanceOrig": newbalance_orig,
            "nameDest": name_dest,
            "oldbalanceDest": oldbalance_dest,
            "newbalanceDest": newbalance_dest,
            "isFraud": 0,
            "isFlaggedFraud": 0
        })

    # 2. Generate fraud transactions (in PaySim, fraud is strictly TRANSFER and CASH_OUT)
    fraud_orig_pool = [f"C{random.randint(900000000, 999999999)}" for _ in range(150)]
    for _ in range(num_fraud):
        step = random.randint(1, 744)
        txn_type = random.choice(["TRANSFER", "CASH_OUT"])
        name_orig = random.choice(fraud_orig_pool)
        name_dest = f"C{random.randint(500000000, 599999999)}"

        # Fraud pattern: large amounts, draining the account completely, creating severe balance discrepancy
        amount = round(random.uniform(50000.0, 800000.0), 2)
        oldbalance_org = amount # Drains entire balance to 0
        newbalance_orig = 0.0

        # Destination balance mismatch: recipient account balance often shows 0 before and 0 after (cash laundered out)
        if random.random() < 0.6:
            oldbalance_dest = 0.0
            newbalance_dest = 0.0 # Extreme discrepancy: amount transferred but dest balance didn't increase
        else:
            oldbalance_dest = round(random.uniform(0.0, 10000.0), 2)
            newbalance_dest = round(oldbalance_dest + amount, 2)

        is_flagged = 1 if amount > 200000 else 0

        records.append({
            "step": step,
            "type": txn_type,
            "amount": amount,
            "nameOrig": name_orig,
            "oldbalanceOrg": oldbalance_org,
            "newbalanceOrig": newbalance_orig,
            "nameDest": name_dest,
            "oldbalanceDest": oldbalance_dest,
            "newbalanceDest": newbalance_dest,
            "isFraud": 1,
            "isFlaggedFraud": is_flagged
        })

    df = pd.DataFrame(records)
    # Sort chronologically by step
    df = df.sort_values(by=["step"]).reset_index(drop=True)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Sample PaySim dataset saved to: {output_path}")
    print(f"          Total rows: {len(df):,} | Fraud count: {df['isFraud'].sum():,} ({df['isFraud'].mean()*100:.2f}%)")
    return output_path


if __name__ == "__main__":
    generate_paysim_dataset()
