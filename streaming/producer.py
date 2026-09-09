"""
producer.py
===========
Real-time transaction stream producer.
Reads the PaySim dataset sorted chronologically by 'step', filters for high-risk transaction
types (TRANSFER and CASH_OUT by default), and streams each transaction as JSON to the Kafka
'transactions' topic with a configurable delay.
"""

import os
import sys
import time
import json
import argparse
from typing import Optional
import pandas as pd

try:
    from kafka import KafkaProducer
    from kafka.errors import NoBrokersAvailable
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

# Local modules
try:
    from streaming.config import (
        KAFKA_BOOTSTRAP_SERVERS,
        TRANSACTIONS_TOPIC,
        DEFAULT_PRODUCE_DELAY,
        DEFAULT_ALLOWED_TYPES,
        PAYSIM_SEARCH_PATHS,
        STREAMING_DIR,
    )
    from streaming.generate_sample_data import generate_paysim_dataset
except ImportError:
    from config import (
        KAFKA_BOOTSTRAP_SERVERS,
        TRANSACTIONS_TOPIC,
        DEFAULT_PRODUCE_DELAY,
        DEFAULT_ALLOWED_TYPES,
        PAYSIM_SEARCH_PATHS,
        STREAMING_DIR,
    )
    from generate_sample_data import generate_paysim_dataset


def get_dataset_path(provided_path: Optional[str] = None) -> str:
    """Finds existing PaySim CSV or generates sample data."""
    if provided_path and os.path.exists(provided_path):
        return provided_path

    for candidate in PAYSIM_SEARCH_PATHS:
        if os.path.exists(candidate):
            return candidate

    print("[PRODUCER] No existing PaySim CSV found. Generating sample data...")
    sample_path = os.path.join(STREAMING_DIR, "data", "paysim_sample.csv")
    generate_paysim_dataset(num_records=15000, fraud_rate=0.05, output_path=sample_path)
    return sample_path


def create_kafka_producer(bootstrap_servers: str, retries: int = 5, retry_delay: float = 3.0):
    """Connects to Kafka broker with retry logic."""
    if not HAS_KAFKA:
        print("[ERROR] 'kafka-python-ng' is not installed. Please run: pip install -r streaming/requirements.txt")
        sys.exit(1)

    print(f"[PRODUCER] Connecting to Kafka broker at {bootstrap_servers}...")
    for attempt in range(1, retries + 1):
        try:
            producer = KafkaProducer(
                bootstrap_servers=bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                acks=1,
                retries=3,
                request_timeout_ms=10000,
            )
            print(f"[PRODUCER] Successfully connected to Kafka!")
            return producer
        except NoBrokersAvailable:
            print(f"[WARN] Kafka broker not reachable (attempt {attempt}/{retries}). Retrying in {retry_delay}s...")
            time.sleep(retry_delay)

    print(f"[ERROR] Could not connect to Kafka at {bootstrap_servers}. Ensure Docker Kafka is running (docker-compose up -d).")
    sys.exit(1)


def stream_transactions(
    csv_path: str,
    bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS,
    topic: str = TRANSACTIONS_TOPIC,
    delay_seconds: float = DEFAULT_PRODUCE_DELAY,
    include_all_types: bool = False,
    max_records: Optional[int] = None,
):
    """
    Reads CSV, sorts by step, filters types, and produces JSON messages to Kafka.
    """
    producer = create_kafka_producer(bootstrap_servers)

    print(f"\n[PRODUCER] Loading transactions from: {csv_path}")
    df = pd.read_csv(csv_path)

    # 1. Sort strictly by step for chronological stream
    print(f"[PRODUCER] Sorting {len(df):,} transactions chronologically by 'step'...")
    df = df.sort_values(by=["step"]).reset_index(drop=True)

    # 2. Filter transaction types
    if not include_all_types:
        before_count = len(df)
        df = df[df["type"].str.upper().isin(DEFAULT_ALLOWED_TYPES)].reset_index(drop=True)
        print(f"[PRODUCER] Filtered to {DEFAULT_ALLOWED_TYPES}: {len(df):,} / {before_count:,} records.")
    else:
        print(f"[PRODUCER] Streaming ALL transaction types ({len(df):,} records).")

    if max_records and max_records > 0:
        df = df.iloc[:max_records]
        print(f"[PRODUCER] Limiting stream to first {len(df):,} records.")

    print(f"\n" + "=" * 65)
    print(f"🚀 STARTING REAL-TIME TRANSACTION STREAM")
    print(f"   Target Topic : {topic}")
    print(f"   Total Records: {len(df):,}")
    print(f"   Inter-msg Gap: {delay_seconds:.3f}s (~{int(1/delay_seconds if delay_seconds > 0 else 0)} msgs/sec)")
    print(f"   Press Ctrl+C to pause or stop stream.")
    print("=" * 65 + "\n")

    produced_count = 0
    start_time = time.time()

    try:
        for idx, row in df.iterrows():
            record = {
                "txn_id": f"TXN-{int(row.get('step', 1)):04d}-{idx:07d}",
                "step": int(row.get("step", 1)),
                "type": str(row.get("type", "TRANSFER")).upper().strip(),
                "amount": float(row.get("amount", 0.0)),
                "nameOrig": str(row.get("nameOrig", "")),
                "oldbalanceOrg": float(row.get("oldbalanceOrg", 0.0)),
                "newbalanceOrig": float(row.get("newbalanceOrig", 0.0)),
                "nameDest": str(row.get("nameDest", "")),
                "oldbalanceDest": float(row.get("oldbalanceDest", 0.0)),
                "newbalanceDest": float(row.get("newbalanceDest", 0.0)),
                "ground_truth_fraud": int(row.get("isFraud", 0)) if "isFraud" in row else None,
                "timestamp": time.time(),
            }

            # Use nameOrig as partition key to preserve account ordering across partitions
            producer.send(topic, key=record["nameOrig"], value=record)
            produced_count += 1

            if produced_count % 50 == 0 or produced_count <= 5:
                elapsed = time.time() - start_time
                rate = produced_count / max(0.001, elapsed)
                print(
                    f"[{time.strftime('%H:%M:%S')}] Streamed {produced_count:,}/{len(df):,} txns | "
                    f"Step: {record['step']:<3} | Type: {record['type']:<8} | "
                    f"Amount: ${record['amount']:>10,.2f} | Speed: {rate:.1f} txn/s"
                )

            if delay_seconds > 0:
                time.sleep(delay_seconds)

        producer.flush()
        print(f"\n[SUCCESS] Finished streaming all {produced_count:,} transactions.")

    except KeyboardInterrupt:
        print(f"\n[INFO] Streaming paused by user. Produced {produced_count:,} messages.")
    finally:
        producer.close()


def main():
    parser = argparse.ArgumentParser(description="Produce real-time transactions from PaySim dataset to Kafka.")
    parser.add_argument("--data", type=str, default=None, help="Path to PaySim CSV dataset")
    parser.add_argument("--bootstrap-servers", type=str, default=KAFKA_BOOTSTRAP_SERVERS, help="Kafka broker address")
    parser.add_argument("--topic", type=str, default=TRANSACTIONS_TOPIC, help="Kafka topic for transactions")
    parser.add_argument("--delay", type=float, default=DEFAULT_PRODUCE_DELAY, help="Delay between messages in seconds")
    parser.add_argument("--include-all-types", action="store_true", help="Stream all types (not just TRANSFER/CASH_OUT)")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of transactions to stream")
    args = parser.parse_args()

    dataset_path = get_dataset_path(args.data)
    stream_transactions(
        csv_path=dataset_path,
        bootstrap_servers=args.bootstrap_servers,
        topic=args.topic,
        delay_seconds=args.delay,
        include_all_types=args.include_all_types,
        max_records=args.limit,
    )


if __name__ == "__main__":
    main()
