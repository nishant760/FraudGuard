"""
consumer.py
===========
Real-time scoring service and fraud detector.
Subscribes to the 'transactions' topic, computes stateful sliding-window velocity features,
extracts balance discrepancy and temporal features, scores transactions in real time with the
trained ML model, persists every prediction to SQLite and log files, and publishes flagged
fraud cases to the 'fraud_alerts' topic.
"""

import os
import sys
import time
import json
import sqlite3
import logging
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import joblib

try:
    from kafka import KafkaConsumer, KafkaProducer
    from kafka.errors import NoBrokersAvailable
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

# Local modules
try:
    from streaming.config import (
        KAFKA_BOOTSTRAP_SERVERS,
        TRANSACTIONS_TOPIC,
        FRAUD_ALERTS_TOPIC,
        MODEL_PATH,
        DB_PATH,
        LOG_PATH,
        VELOCITY_WINDOW_STEPS,
        FRAUD_THRESHOLD,
        HIGH_RISK_THRESHOLD,
        MEDIUM_RISK_THRESHOLD,
    )
    from streaming.sliding_window import SlidingWindowTracker
    from streaming.feature_pipeline import extract_single_record_features, FEATURE_NAMES
except ImportError:
    from config import (
        KAFKA_BOOTSTRAP_SERVERS,
        TRANSACTIONS_TOPIC,
        FRAUD_ALERTS_TOPIC,
        MODEL_PATH,
        DB_PATH,
        LOG_PATH,
        VELOCITY_WINDOW_STEPS,
        FRAUD_THRESHOLD,
        HIGH_RISK_THRESHOLD,
        MEDIUM_RISK_THRESHOLD,
    )
    from sliding_window import SlidingWindowTracker
    from feature_pipeline import extract_single_record_features, FEATURE_NAMES


# ── SQLite Database Setup ───────────────────────────────────────────────────────
def init_database(db_path: str = DB_PATH) -> sqlite3.Connection:
    """Initializes the SQLite database and predictions table."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txn_id TEXT,
            step INTEGER,
            type TEXT,
            amount REAL,
            name_orig TEXT,
            name_dest TEXT,
            error_balance_orig REAL,
            error_balance_dest REAL,
            orig_txn_count_window REAL,
            orig_amount_sum_window REAL,
            fraud_probability REAL,
            risk_score REAL,
            risk_level TEXT,
            is_fraud_predicted INTEGER,
            ground_truth_fraud INTEGER,
            latency_ms REAL,
            created_at TEXT
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_txn_id ON predictions(txn_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_is_fraud ON predictions(is_fraud_predicted)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_step ON predictions(step)")
    conn.commit()
    return conn


def save_prediction_to_db(conn: sqlite3.Connection, record: Dict[str, Any]):
    """Inserts a scored transaction record into SQLite."""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO predictions (
            txn_id, step, type, amount, name_orig, name_dest,
            error_balance_orig, error_balance_dest,
            orig_txn_count_window, orig_amount_sum_window,
            fraud_probability, risk_score, risk_level,
            is_fraud_predicted, ground_truth_fraud, latency_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["txn_id"],
        record["step"],
        record["type"],
        record["amount"],
        record["nameOrig"],
        record["nameDest"],
        record["errorBalanceOrig"],
        record["errorBalanceDest"],
        record["orig_txn_count_window"],
        record["orig_amount_sum_window"],
        record["fraud_probability"],
        record["risk_score"],
        record["risk_level"],
        record["is_fraud_predicted"],
        record.get("ground_truth_fraud"),
        record["latency_ms"],
        datetime.utcnow().isoformat(),
    ))
    conn.commit()


# ── File Logger Setup ──────────────────────────────────────────────────────────
def setup_file_logger(log_path: str = LOG_PATH) -> logging.Logger:
    """Sets up a structured rotating file logger."""
    os.makedirs(os.path.dirname(os.path.abspath(log_path)), exist_ok=True)
    logger = logging.getLogger("fraudguard_consumer")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        fh = logging.FileHandler(log_path)
        formatter = logging.Formatter('{"time":"%(asctime)s", "level":"%(levelname)s", "data": %(message)s}')
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    return logger


# ── Model Scorer Class ────────────────────────────────────────────────────────
class FraudScoringEngine:
    """Loads model artifact and handles real-time feature engineering & inference."""

    def __init__(self, model_path: str = MODEL_PATH, window_steps: int = VELOCITY_WINDOW_STEPS):
        self.model_path = model_path
        self.window_steps = window_steps
        self.window_tracker = SlidingWindowTracker(window_steps=window_steps)
        self.model = None
        self.feature_names = FEATURE_NAMES
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model file not found at '{self.model_path}'. "
                f"Please train the model first by running: python streaming/train.py"
            )
        print(f"[SCORER] Loading model artifact from: {self.model_path}")
        artifact = joblib.load(self.model_path)
        if isinstance(artifact, dict) and "model" in artifact:
            self.model = artifact["model"]
            self.feature_names = artifact.get("feature_names", FEATURE_NAMES)
            print(f"[SCORER] Model type: {artifact.get('model_type', 'Classifier')} | ROC-AUC: {artifact.get('metrics', {}).get('roc_auc', 'N/A')}")
        else:
            self.model = artifact

    def score_transaction(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a single incoming transaction dictionary:
        1. Updates sliding window velocity state.
        2. Computes balance discrepancy features.
        3. Runs inference with ML model.
        4. Calculates risk level and scoring metrics.
        """
        t0 = time.perf_counter()

        name_orig = str(record.get("nameOrig", ""))
        step = int(record.get("step", 1))
        amount = float(record.get("amount", 0.0))

        # 1. Update sliding window velocity tracker
        velocity_feats = self.window_tracker.update_and_get_features(
            name_orig=name_orig,
            step=step,
            amount=amount
        )

        # 2. Extract complete feature row
        X_row = extract_single_record_features(record, velocity_feats)

        # 3. Model Inference
        prob = float(self.model.predict_proba(X_row)[0, 1])
        is_fraud = 1 if prob >= FRAUD_THRESHOLD else 0
        risk_score = round(prob * 100.0, 2)

        # 4. Risk Categorization
        if prob >= HIGH_RISK_THRESHOLD:
            risk_level = "CRITICAL" if prob >= 0.90 else "HIGH"
        elif prob >= MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        oldbalanceOrg = float(record.get("oldbalanceOrg", 0.0))
        newbalanceOrig = float(record.get("newbalanceOrig", 0.0))
        oldbalanceDest = float(record.get("oldbalanceDest", 0.0))
        newbalanceDest = float(record.get("newbalanceDest", 0.0))

        return {
            "txn_id": record.get("txn_id", f"TXN-{step}-{int(time.time()*1000)}"),
            "step": step,
            "type": record.get("type", "UNKNOWN"),
            "amount": amount,
            "nameOrig": name_orig,
            "nameDest": record.get("nameDest", ""),
            "oldbalanceOrg": oldbalanceOrg,
            "newbalanceOrig": newbalanceOrig,
            "oldbalanceDest": oldbalanceDest,
            "newbalanceDest": newbalanceDest,
            "errorBalanceOrig": float((oldbalanceOrg - amount) - newbalanceOrig),
            "errorBalanceDest": float((oldbalanceDest + amount) - newbalanceDest),
            "orig_txn_count_window": velocity_feats["orig_txn_count_window"],
            "orig_amount_sum_window": velocity_feats["orig_amount_sum_window"],
            "orig_amount_avg_window": velocity_feats["orig_amount_avg_window"],
            "fraud_probability": round(prob, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "is_fraud_predicted": is_fraud,
            "ground_truth_fraud": record.get("ground_truth_fraud"),
            "latency_ms": latency_ms,
            "timestamp": datetime.utcnow().isoformat(),
        }


# ── Consumer Execution Loop ────────────────────────────────────────────────────
def run_consumer(
    bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS,
    transactions_topic: str = TRANSACTIONS_TOPIC,
    fraud_alerts_topic: str = FRAUD_ALERTS_TOPIC,
    model_path: str = MODEL_PATH,
    db_path: str = DB_PATH,
):
    """Subscribes to transactions topic and executes real-time scoring."""
    if not HAS_KAFKA:
        print("[ERROR] 'kafka-python-ng' is not installed. Please run: pip install -r streaming/requirements.txt")
        sys.exit(1)

    print(f"[CONSUMER] Initializing Real-Time FraudGuard Scoring Service...")
    db_conn = init_database(db_path)
    file_logger = setup_file_logger()
    engine = FraudScoringEngine(model_path=model_path)

    # Kafka Consumer for incoming transactions
    consumer = KafkaConsumer(
        transactions_topic,
        bootstrap_servers=bootstrap_servers,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        group_id="fraudguard-scoring-group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    # Kafka Producer for publishing fraud alerts
    producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None,
        acks=1,
    )

    print("\n" + "=" * 80)
    print(f"🎯 FRAUDGUARD REAL-TIME SCORING CONSUMER READY")
    print(f"   Subscribed to : {transactions_topic}")
    print(f"   Alerts topic  : {fraud_alerts_topic}")
    print(f"   Database      : {db_path}")
    print(f"   Model file    : {model_path}")
    print("=" * 80 + "\n")

    total_scored = 0
    total_flagged = 0

    try:
        for msg in consumer:
            txn_data = msg.value
            result = engine.score_transaction(txn_data)
            total_scored += 1

            # 1. Log to SQLite & log file
            save_prediction_to_db(db_conn, result)
            file_logger.info(json.dumps(result))

            # 2. Forward to alert topic if flagged
            if result["is_fraud_predicted"] == 1:
                total_flagged += 1
                producer.send(fraud_alerts_topic, key=result["nameOrig"], value=result)

            # 3. Terminal display
            status_symbol = "🚨 [FRAUD ALERT]" if result["is_fraud_predicted"] == 1 else "✅ [LEGITIMATE]"
            print(
                f"{status_symbol} {result['txn_id']} | "
                f"Step: {result['step']:<3} | {result['type']:<8} | "
                f"Amt: ${result['amount']:>10,.2f} | "
                f"Risk: {result['risk_score']:>5.1f}% ({result['risk_level']:<8}) | "
                f"DiscrepancyOrig: ${result['errorBalanceOrig']:>10,.2f} | "
                f"WindowTxns: {int(result['orig_txn_count_window'])} | "
                f"Latency: {result['latency_ms']}ms"
            )

    except KeyboardInterrupt:
        print(f"\n[CONSUMER] Stopped. Total Scored: {total_scored:,} | Total Flagged Fraud: {total_flagged:,}")
    finally:
        consumer.close()
        producer.close()
        db_conn.close()


def main():
    parser = argparse.ArgumentParser(description="Consume transactions from Kafka and score for fraud in real time.")
    parser.add_argument("--bootstrap-servers", type=str, default=KAFKA_BOOTSTRAP_SERVERS, help="Kafka broker address")
    parser.add_argument("--topic", type=str, default=TRANSACTIONS_TOPIC, help="Transactions topic")
    parser.add_argument("--alerts-topic", type=str, default=FRAUD_ALERTS_TOPIC, help="Fraud alerts topic")
    parser.add_argument("--model", type=str, default=MODEL_PATH, help="Path to trained model artifact")
    parser.add_argument("--db", type=str, default=DB_PATH, help="Path to SQLite database")
    args = parser.parse_args()

    run_consumer(
        bootstrap_servers=args.bootstrap_servers,
        transactions_topic=args.topic,
        fraud_alerts_topic=args.alerts_topic,
        model_path=args.model,
        db_path=args.db,
    )


if __name__ == "__main__":
    main()
