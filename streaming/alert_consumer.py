"""
alert_consumer.py
=================
Dedicated alerting consumer for high-risk and fraudulent transactions.
Subscribes to the 'fraud_alerts' Kafka topic and outputs structured real-time alerts
highlighting balance discrepancy anomalies, velocity spikes, and risk scores.
"""

import sys
import json
import time
import argparse
from datetime import datetime

try:
    from kafka import KafkaConsumer
    from kafka.errors import NoBrokersAvailable
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

# Local modules
try:
    from streaming.config import KAFKA_BOOTSTRAP_SERVERS, FRAUD_ALERTS_TOPIC
except ImportError:
    from config import KAFKA_BOOTSTRAP_SERVERS, FRAUD_ALERTS_TOPIC


def format_alert_box(alert: dict) -> str:
    """Formats an alert into a clean, high-visibility terminal card."""
    txn_id = alert.get("txn_id", "UNKNOWN")
    step = alert.get("step", 0)
    hour_of_day = step % 24
    txn_type = alert.get("type", "UNKNOWN")
    amount = float(alert.get("amount", 0.0))
    name_orig = alert.get("nameOrig", "N/A")
    name_dest = alert.get("nameDest", "N/A")
    risk_score = alert.get("risk_score", 0.0)
    risk_level = alert.get("risk_level", "HIGH")
    prob = alert.get("fraud_probability", 0.0)
    err_orig = float(alert.get("errorBalanceOrig", 0.0))
    err_dest = float(alert.get("errorBalanceDest", 0.0))
    win_txns = int(alert.get("orig_txn_count_window", 1))
    win_sum = float(alert.get("orig_amount_sum_window", amount))

    # Anomaly flags
    anomalies = []
    if abs(err_orig) > 1.0:
        anomalies.append(f"Origin balance discrepancy of ${err_orig:,.2f}")
    if abs(err_dest) > 1.0:
        anomalies.append(f"Destination balance discrepancy of ${err_dest:,.2f}")
    if win_txns > 1:
        anomalies.append(f"Velocity burst: {win_txns} txns in window totaling ${win_sum:,.2f}")
    if amount >= 200000.0:
        anomalies.append(f"Large transfer threshold exceeded (${amount:,.2f} >= $200k)")

    anomaly_str = "\n  │  • " + "\n  │  • ".join(anomalies) if anomalies else "\n  │  • Model probability threshold exceeded"

    box = f"""
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ 🚨 FRAUD ALERT DETECTED — {txn_id:<25} Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  │
  ├────────────────────────────────────────────────────────────────────────────┤
  │  Risk Score     : {risk_score:>5.1f}%  [{risk_level}] (Probability: {prob:.4f})
  │  Transaction    : {txn_type:<10} Amount: ${amount:>12,.2f} (Step {step}, {hour_of_day:02d}:00)
  │  Origin Account : {name_orig:<20} Dest Account: {name_dest}
  │  Key Fraud Signals Detected:{anomaly_str}
  └────────────────────────────────────────────────────────────────────────────┘"""
    return box


def run_alert_consumer(
    bootstrap_servers: str = KAFKA_BOOTSTRAP_SERVERS,
    topic: str = FRAUD_ALERTS_TOPIC,
):
    """Subscribes to fraud_alerts topic and displays alerts."""
    if not HAS_KAFKA:
        print("[ERROR] 'kafka-python-ng' is not installed. Please run: pip install -r streaming/requirements.txt")
        sys.exit(1)

    print(f"[ALERT CONSUMER] Connecting to Kafka at {bootstrap_servers}...")
    try:
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            auto_offset_reset="latest",
            enable_auto_commit=True,
            group_id="fraudguard-alert-group",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )
    except Exception as e:
        print(f"[ERROR] Failed to connect to Kafka topic '{topic}': {e}")
        sys.exit(1)

    print("\n" + "=" * 80)
    print(f"🚨 FRAUDGUARD REAL-TIME ALERT MONITOR ACTIVE")
    print(f"   Listening on topic: {topic}")
    print(f"   Waiting for flagged fraudulent transactions...")
    print("=" * 80 + "\n")

    alert_count = 0
    try:
        for msg in consumer:
            alert_count += 1
            alert_data = msg.value
            print(format_alert_box(alert_data))
    except KeyboardInterrupt:
        print(f"\n[ALERT CONSUMER] Stopped by user. Total alerts monitored: {alert_count:,}")
    finally:
        consumer.close()


def main():
    parser = argparse.ArgumentParser(description="Consume fraud alerts from Kafka and display notifications.")
    parser.add_argument("--bootstrap-servers", type=str, default=KAFKA_BOOTSTRAP_SERVERS, help="Kafka broker address")
    parser.add_argument("--topic", type=str, default=FRAUD_ALERTS_TOPIC, help="Fraud alerts topic")
    args = parser.parse_args()

    run_alert_consumer(
        bootstrap_servers=args.bootstrap_servers,
        topic=args.topic,
    )


if __name__ == "__main__":
    main()
