# Financial Transaction Fraud Detection & Real-Time Streaming Intelligence Platform (FraudGuard-AI)

## Overview
**FraudGuard-AI** is an end-to-end enterprise-grade Fraud Detection and Risk Intelligence Platform. It provides two complementary operational modes:
1. **Interactive Batch & Web API Mode (`/backend`, `/frontend`, `/ml`)**: A FastAPI service and React 19 dashboard evaluating single/batch transactions and visualizing risk metrics.
2. **Real-Time Streaming Engine (`/streaming`)**: An event-driven Kafka streaming pipeline simulating live transaction streams from the **PaySim mobile money dataset**, performing real-time sliding-window velocity tracking, ML scoring with balance discrepancy analysis, and instant alerting.

---

## Real-Time Streaming Architecture (`/streaming`)

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 PaySim Dataset (CSV)                    │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │     producer.py (Stream)      │
                             │  • Time-ordered by `step`     │
                             │  • TRANSFER & CASH_OUT filter │
                             │  • Configurable delay / rate  │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │   Kafka Topic: transactions   │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │     consumer.py (Scorer)      │
                             │  • Real-time sliding window   │
                             │  • Balance discrepancy feats  │
                             │  • Trained ML model scoring   │
                             │  • SQLite & file logging      │
                             └───────┬───────────────┬───────┘
                                     │               │
                     (All Txns)      ▼               ▼  (If Flagged Fraud)
               ┌───────────────────────┐   ┌───────────────────────────┐
               │ predictions.db / log  │   │ Kafka Topic: fraud_alerts │
               └───────────────────────┘   └─────────────┬─────────────┘
                                                         │
                                                         ▼
                                           ┌───────────────────────────┐
                                           │    alert_consumer.py      │
                                           │  • Real-time CLI Alerts   │
                                           │  • Discrepancy & velocity │
                                           └───────────────────────────┘
```

### PaySim Dataset & Fraud Characteristics
The system uses the **PaySim synthetic mobile money financial dataset**, simulating 30 days of real-world mobile transaction logs (744 steps, where 1 step = 1 hour).

| Column Name | Description | Key Fraud Relevance |
| :--- | :--- | :--- |
| `step` | Time step in hours (1..744) | Preserves chronological stream ordering and time-of-day dynamics. |
| `type` | `CASH_IN`, `CASH_OUT`, `DEBIT`, `PAYMENT`, `TRANSFER` | **Fraud only occurs in `TRANSFER` and `CASH_OUT`** transactions. |
| `amount` | Transaction value in local currency | Fraudulent transfers attempt large account-draining sums. |
| `nameOrig` | Customer who initiated the transaction | Grouping key for velocity burst calculation. |
| `oldbalanceOrg` / `newbalanceOrig` | Sender balances before and after transaction | Creates **origin balance discrepancy**: `(oldbalanceOrg - amount) - newbalanceOrig`. |
| `nameDest` | Recipient customer or merchant | Used to differentiate peer vs merchant transactions. |
| `oldbalanceDest` / `newbalanceDest` | Recipient balances before and after transaction | Creates **destination balance discrepancy**: `(oldbalanceDest + amount) - newbalanceDest`. |
| `isFraud` | Ground-truth fraud label (0 or 1) | Target classification label. |

### Balance Discrepancy & Velocity Feature Engineering
1. **Origin Discrepancy (`errorBalanceOrig`)**: $\text{errorBalanceOrig} = (\text{oldbalanceOrg} - \text{amount}) - \text{newbalanceOrig}$. In normal transactions, this is 0. In fraud, fraudsters often drain the account completely or attempt unauthorized overdrafts.
2. **Destination Discrepancy (`errorBalanceDest`)**: $\text{errorBalanceDest} = (\text{oldbalanceDest} + \text{amount}) - \text{newbalanceDest}$. Fraudulent recipients often show 0 balance before and after (immediate cash-out or mule routing).
3. **Sliding-Window Velocity Features (`sliding_window.py`)**: Tracks rolling $N$-step history per `nameOrig`:
   - `orig_txn_count_window`: Number of transactions from sender in the last $N$ steps.
   - `orig_amount_sum_window`: Total monetary volume sent in the last $N$ steps.
   - `orig_amount_avg_window`: Average monetary volume per transaction in the window.

---

## Project Structure

```
FraudGuard-AI/
├── docker-compose.yml        # Local Apache Kafka (KRaft mode, no ZooKeeper)
├── streaming/                # Real-Time Kafka Streaming Engine
│   ├── docker-compose.yml    # Kafka cluster setup
│   ├── config.py             # Central streaming configuration
│   ├── requirements.txt      # Python dependencies for streaming & ML
│   ├── sliding_window.py     # Stateful rolling-window velocity engine
│   ├── feature_pipeline.py   # Shared feature extraction pipeline
│   ├── generate_sample_data.py # Sample PaySim dataset generator
│   ├── train.py              # ML training with SMOTE & PaySim features
│   ├── producer.py           # Time-ordered Kafka transaction stream producer
│   ├── consumer.py           # Real-time scoring consumer & SQLite recorder
│   ├── alert_consumer.py     # Real-time high-visibility alert monitor
│   ├── data/                 # Location for paysim.csv / paysim_sample.csv
│   └── models/               # Saved models (paysim_model.joblib)
├── ml/                       # Original IEEE-CIS Batch ML Pipeline
├── backend/                  # FastAPI Application & SQLite DB
├── frontend/                 # React 19 + Vite Dashboard
└── README.md
```

---

## How to Run the Streaming Pipeline

### Step 1: Start Apache Kafka via Docker
Spin up Kafka in KRaft mode (topics `transactions` and `fraud_alerts` are automatically created):
```bash
docker compose up -d
```
Verify Kafka is running:
```bash
docker ps
```

### Step 2: Install Streaming Dependencies
```bash
cd streaming
pip install -r requirements.txt
```

### Step 3: Train the PaySim Model (if not already trained)
You can train the model on the sample dataset or your full PaySim CSV:
```bash
# Using sample / auto-generated data:
python train.py

# Or specifying your downloaded Kaggle PaySim CSV:
python train.py --data data/paysim.csv
```

### Step 4: Start the Alert Consumer (Terminal 1)
In your first terminal, start the alert monitor:
```bash
python alert_consumer.py
```

### Step 5: Start the Real-Time Scoring Consumer (Terminal 2)
In your second terminal, start the scoring service:
```bash
python consumer.py
```

### Step 6: Start the Transaction Stream Producer (Terminal 3)
In your third terminal, start streaming transactions:
```bash
# Streams TRANSFER and CASH_OUT rows with 0.05s delay:
python producer.py

# Optional: Stream all transaction types:
python producer.py --include-all-types

# Optional: Adjust delay / speed:
python producer.py --delay 0.01
```

---

## How to Run the Web Dashboard & API

### 1. Start the Backend API
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Dashboard: `http://localhost:5173`
