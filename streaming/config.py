"""
config.py
=========
Central configuration for the FraudGuard real-time streaming pipeline.
Supports environment variable overrides for containerized or production deployments.
"""

import os

# Base paths
STREAMING_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(STREAMING_DIR)

DATA_DIR = os.path.join(STREAMING_DIR, "data")
MODELS_DIR = os.path.join(STREAMING_DIR, "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Candidate paths for PaySim dataset (checked in order)
PAYSIM_SEARCH_PATHS = [
    os.path.join(DATA_DIR, "paysim.csv"),
    os.path.join(DATA_DIR, "PS_20174392719_1491204439457_log.csv"),
    os.path.join(PROJECT_ROOT, "data", "paysim.csv"),
    os.path.join(PROJECT_ROOT, "data", "raw", "paysim.csv"),
    os.path.join(PROJECT_ROOT, "data", "raw", "PS_20174392719_1491204439457_log.csv"),
    os.path.join(DATA_DIR, "paysim_sample.csv"),
]

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TRANSACTIONS_TOPIC = os.getenv("TRANSACTIONS_TOPIC", "transactions")
FRAUD_ALERTS_TOPIC = os.getenv("FRAUD_ALERTS_TOPIC", "fraud_alerts")

# Model and Storage paths
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(MODELS_DIR, "paysim_model.joblib"))
METRICS_PATH = os.getenv("METRICS_PATH", os.path.join(MODELS_DIR, "model_metrics.json"))
DB_PATH = os.getenv("DB_PATH", os.path.join(STREAMING_DIR, "predictions.db"))
LOG_PATH = os.getenv("LOG_PATH", os.path.join(STREAMING_DIR, "predictions.log"))

# Velocity / Sliding Window Parameters
# In PaySim, 1 step represents 1 hour. A 24-step window represents a 24-hour rolling window.
VELOCITY_WINDOW_STEPS = int(os.getenv("VELOCITY_WINDOW_STEPS", "24"))

# Producer defaults
DEFAULT_PRODUCE_DELAY = float(os.getenv("DEFAULT_PRODUCE_DELAY", "0.05"))
DEFAULT_ALLOWED_TYPES = ["TRANSFER", "CASH_OUT"]

# Model scoring threshold (0.0 to 1.0)
FRAUD_THRESHOLD = float(os.getenv("FRAUD_THRESHOLD", "0.50"))
HIGH_RISK_THRESHOLD = float(os.getenv("HIGH_RISK_THRESHOLD", "0.75"))
MEDIUM_RISK_THRESHOLD = float(os.getenv("MEDIUM_RISK_THRESHOLD", "0.40"))
