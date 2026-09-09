# How to Run FraudGuard-AI (Complete Guide)

This guide covers both modes of FraudGuard-AI:
1. **Real-Time Streaming Engine (Kafka + PaySim ML)**
2. **Interactive Web Dashboard & FastAPI Backend**

---

## Prerequisites
- **Python 3.10+**
- **Docker Desktop** (for Apache Kafka)
- **Node.js 20+ & npm** (for React Frontend)
- **libomp** (on macOS for XGBoost):
  ```bash
  HOMEBREW_NO_AUTO_UPDATE=1 brew install libomp
  ```

---

## Mode 1: Real-Time Streaming Pipeline (Kafka + PaySim)

Follow these steps to run the complete real-time streaming fraud detection system:

### 1. Start Apache Kafka
In your terminal, navigate to the project root and start Kafka in KRaft mode:
```bash
docker compose up -d
```
*(This automatically boots Kafka and provisions the `transactions` and `fraud_alerts` topics).*

### 2. Install Dependencies & Train the PaySim Model
```bash
cd streaming
pip install -r requirements.txt
python train.py
```
*(If you have the full Kaggle `paysim.csv` or `PS_20174392719_1491204439457_log.csv`, place it in `streaming/data/paysim.csv` or pass `--data path/to/paysim.csv`).*

### 3. Open 3 Terminals to Run the Stream

#### Terminal 1 — Start the Alert Consumer
```bash
cd streaming
python alert_consumer.py
```
*Listens on topic `fraud_alerts` and prints rich formatted warning boxes for flagged transactions.*

#### Terminal 2 — Start the Scoring Consumer
```bash
cd streaming
python consumer.py
```
*Subscribes to `transactions`, computes rolling window velocity features, scores in real time with the ML model, logs to SQLite (`predictions.db`), and forwards high-risk events to `fraud_alerts`.*

#### Terminal 3 — Start the Transaction Producer
```bash
cd streaming
python producer.py
```
*Reads PaySim chronologically by `step`, filters for `TRANSFER` and `CASH_OUT`, and streams transactions as JSON to Kafka with simulated live delay.*

---

## Mode 2: Interactive Web Dashboard & API

### 1. Start the FastAPI Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the React Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Dashboard: [http://localhost:5173](http://localhost:5173)

---

## Summary of Topics & Data Stores
- **Kafka Topics**:
  - `transactions`: Live incoming transaction feed published by `producer.py`.
  - `fraud_alerts`: High-risk flagged fraud events published by `consumer.py`.
- **Databases & Logs**:
  - `streaming/predictions.db`: SQLite database storing every scored transaction, probabilities, risk levels, and latency.
  - `streaming/predictions.log`: Structured JSON log file of predictions.
  - `backend/fraud_detection.db`: SQLite database used by the FastAPI web service.
