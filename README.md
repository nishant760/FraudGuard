# 🛡️ FraudGuard-AI: Enterprise Financial Fraud Detection & Real-Time Risk Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600.svg)](https://xgboost.readthedocs.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.7%20(KRaft)-231F20.svg)](https://kafka.apache.org/)
[![SHAP](https://img.shields.io/badge/Explainability-TreeSHAP-8A2BE2.svg)](https://shap.readthedocs.io/)

> **FraudGuard-AI** is a production-grade, full-stack Financial Fraud Detection and Risk Intelligence Platform. It pairs dual-engine Machine Learning pipelines (IEEE-CIS Card-Not-Present Fraud & PaySim Mobile Money Streaming) with **Native TreeSHAP Explainability (XAI)**, **Adaptive Risk-Based 2FA Multi-Factor Authentication**, and a high-throughput **Apache Kafka Streaming Architecture**.

---

## 📑 Table of Contents
1. [Platform Architecture & System Design](#-platform-architecture--system-design)
2. [Key Highlights & Capabilities](#-key-highlights--capabilities)
3. [Dual-Engine Machine Learning Architecture](#-dual-engine-machine-learning-architecture)
4. [Explainable AI (TreeSHAP) Integration](#-explainable-ai-treeshap-integration)
5. [Adaptive 2FA & Multi-Factor Security System](#-adaptive-2fa--multi-factor-security-system)
6. [Apache Kafka Real-Time Streaming Pipeline](#-apache-kafka-real-time-streaming-pipeline)
7. [Repository File Structure](#-repository-file-structure)
8. [Step-by-Step Installation & Run Guide](#-step-by-step-installation--run-guide)
9. [REST API Endpoints Reference](#-rest-api-endpoints-reference)
10. [Frontend Dashboard Modules](#-frontend-dashboard-modules)
11. [Tech Stack](#-tech-stack)

---

## 🏛️ Platform Architecture & System Design

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │             Incoming Transaction Sources               │
                                  │  • Web UI Manual Assessment / External REST API        │
                                  │  • High-Throughput Event Streams (PaySim Mobile Data)  │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     ▼                                                 ▼
                  ┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
                  │    IEEE-CIS Batch Assessment API     │          │    Apache Kafka Streaming Broker     │
                  │  (FastAPI Server : Port 8000)        │          │  (Port 9092 - KRaft Mode)            │
                  └──────────────────┬───────────────────┘          └──────────────────┬───────────────────┘
                                     │                                                 │
                                     │                                                 ▼
                                     │                              ┌──────────────────────────────────────┐
                                     │                              │      Kafka Producer (producer.py)    │
                                     │                              │  • Time-ordered event serialization  │
                                     │                              │  • Topic: 'transactions'             │
                                     │                              └──────────────────┬───────────────────┘
                                     │                                                 │
                                     │                                                 ▼
                                     │                              ┌──────────────────────────────────────┐
                                     │                              │      Kafka Consumer (consumer.py)    │
                                     │                              │  • 24-step sliding window velocity   │
                                     │                              │  • Balance discrepancy calculation   │
                                     │                              └──────────────────┬───────────────────┘
                                     │                                                 │
                                     ▼                                                 ▼
                  ┌────────────────────────────────────────────────────────────────────────────────────────┐
                  │                     Dual-Engine Machine Learning & Explainability Layer                │
                  │  • Feature Engineering Pipeline (amt_log, tx_hour, C1/C5 count, domain coarsening)    │
                  │  • XGBoost Classification Inference Engine                                             │
                  │  • Native TreeSHAP Exact Additive Attribution Engine (sub-millisecond force vectors)   │
                  └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                             │
                                                             ▼
                  ┌────────────────────────────────────────────────────────────────────────────────────────┐
                  │                        Adaptive Risk Policy & Tier Decisioning                         │
                  │  • LOW RISK (0–30)     → Zero-Friction Auto-Approval & Instant Clearance               │
                  │  • MEDIUM RISK (31–70) → Step-Up 2FA Security Challenge & OTP Dispatch                 │
                  │  • HIGH RISK (71–100)  → Critical 2FA Security Challenge & Account Freeze Protection   │
                  └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                             │
                                     ┌───────────────────────┴────────────────────────┐
                                     ▼                                                ▼
                  ┌─────────────────────────────────────┐          ┌──────────────────────────────────────┐
                  │      Persistent Storage & Audit     │          │    2FA OTP Dispatch & Security Vault │
                  │  • SQLite Database (predictions.db) │          │  • /security Real-time Passcode Log  │
                  │  • Historical Telemetry & Analytics │          │  • Instant 1-Click Passcode Copy     │
                  │  • Topic: 'fraud_alerts'            │          │  • Real-Time Interactive Resolution  │
                  └──────────────────┬──────────────────┘          └──────────────────┬───────────────────┘
                                     │                                                │
                                     └────────────────────────┬───────────────────────┘
                                                              │
                                                              ▼
                  ┌────────────────────────────────────────────────────────────────────────────────────────┐
                  │                      Interactive Frontend Dashboard (React 19 + Vite)                  │
                  │  • Real-Time Streaming Engine (/)      • 2FA & Security Center (/security)             │
                  │  • Manual Assessment & XAI (/assessment) • Analytics & Model Telemetry (/analytics)   │
                  │  • Historical Transaction Audit (/transactions)                                        │
                  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Highlights & Capabilities

- **Dual-Model ML Architecture**: Simultaneous support for e-commerce card-not-present transactions (IEEE-CIS) and high-velocity mobile money transfers (PaySim).
- **Sub-Millisecond Explainable AI (TreeSHAP)**: Uses XGBoost's native TreeSHAP engine to calculate exact Shapley additive force contributions ($+$/$-$ risk values) with zero latency overhead.
- **Adaptive 2FA Multi-Factor Authentication**: Dynamically requires 6-digit OTP challenges for Medium & High-risk transactions while allowing frictionless passage for Low-risk payments.
- **Dedicated 2FA & Security Center (`/security`)**: Full-width, searchable OTP vault with instant copy-paste controls, real-time status filtering, and live transaction amounts.
- **Event-Driven Apache Kafka Streaming (KRaft Mode)**: Containerized Kafka cluster running with producer, real-time scoring consumer, and instant fraud alerting topics.
- **Synchronized Global State**: Background Kafka streaming continues across the entire app without interrupting state when navigating through tabs.
- **Production-Ready REST API**: FastAPI backend with Pydantic v2 schemas, OpenAPI/Swagger interactive documentation, and SQLAlchemy database persistence.

---

## 🧠 Dual-Engine Machine Learning Architecture

### 1. IEEE-CIS Batch & Assessment Classifier (`ml/`)
Trained on the **IEEE-CIS Fraud Detection Benchmark** (590,000+ real-world e-commerce transactions):
- **Model**: Extreme Gradient Boosting (`XGBoostClassifier`)
- **Key Metrics**:
  - **ROC-AUC**: `0.8587`
  - **Recall**: `72.34%`
  - **Precision**: `68.12%`
  - **Inference Latency**: `< 4ms` per transaction
- **Feature Engineering Pipeline**:
  - `amt_log`: Logarithmic transaction amount $\ln(1 + \text{TransactionAmt})$
  - `tx_hour` & `tx_day`: Cyclic temporal behavior extracted from `TransactionDT`
  - `P_emaildomain`: Categorical coarsening into primary providers (`gmail`, `yahoo`, `microsoft`, `anonymous`, `other`)
  - `C1` & `C5`: Frequency velocity counters and association tracking
  - `id_present`: Binary identity profile flag

### 2. PaySim Real-Time Streaming Scorer (`streaming/`)
Trained on the **PaySim Synthetic Mobile Money Dataset** (simulating 30 days / 744 hours of live mobile transactions):
- **Model**: Fast-Inference Tree Scorer with SMOTE class balancing
- **Key Features Engineered**:
  - **Origin Ledger Discrepancy**: $\text{errorBalanceOrig} = (\text{oldbalanceOrg} - \text{amount}) - \text{newbalanceOrig}$
  - **Destination Ledger Discrepancy**: $\text{errorBalanceDest} = (\text{oldbalanceDest} + \text{amount}) - \text{newbalanceDest}$
  - **24-Step Sliding-Window Velocity**:
    - `orig_txn_count_window`: Number of transactions sent by account in rolling 24-step window
    - `orig_amount_sum_window`: Cumulative volume sent in rolling 24-step window
    - `orig_amount_avg_window`: Average transfer volume in rolling 24-step window

---

## 🔮 Explainable AI (TreeSHAP) Integration

Rather than acting as an opaque "black-box", FraudGuard-AI uses **TreeSHAP (SHapley Additive exPlanations)** to compute mathematically proven Shapley values for every prediction:

$$\text{Output Margin } f(x) = \phi_0 + \sum_{i=1}^{M} \phi_i(x)$$

Where:
- $\phi_0$ is the base expected margin (log-odds prior).
- $\phi_i(x)$ is the exact marginal contribution of feature $i$ towards or against fraud.

### Per-Transaction Visual Waterfall & Force Bars
In the **Manual Assessment** dashboard (`/assessment`):
- **Risk-Increasing Factors (Crimson Red `+` Bars)**: Features that pushed the risk score higher (e.g., `Transaction Amount > $2,500 (+0.81)`, `Velocity Spike (+0.32)`, `Missing Identity Record (+0.18)`).
- **Safety Factors (Emerald Green `-` Bars)**: Features that reduced the risk score (e.g., `Standard Billing Region (-0.29)`, `Known Email Provider (-0.14)`).
- **Filter Tabs**: Toggle between **All Factors**, **Risk Drivers (+)**, and **Safety Factors (-)**.

### Global Model Feature Importance Matrix
In the **Analytics & Models** dashboard (`/analytics`):
- Full-width ranking of top feature gain weights across the entire model.
- Categorization across **Amount & Volume**, **Frequency & Velocity**, **Identity & Device**, **Payment Method**, and **Temporal Behavior**.

---

## 🔐 Adaptive 2FA & Multi-Factor Security System

FraudGuard-AI employs an **Adaptive Multi-Factor Authentication (MFA)** policy:

| Risk Tier | Score Band | Automated Security Action | Verification Mechanism |
| :--- | :---: | :--- | :--- |
| **LOW** | $0 - 30$ | **Auto-Approved** | Zero-friction instant clearance & settlement. |
| **MEDIUM** | $31 - 70$ | **2FA Challenge Required** | 6-Digit OTP dispatched; funds held in pending vault. |
| **HIGH** | $71 - 100$ | **Critical 2FA / Card Freeze** | 6-Digit OTP required; immediate card freeze upon failure/abort. |

### 2FA Components:
1. **2FA & Security Center (`/security`)**:
   - Centralized repository of all dispatched security passcodes.
   - Live transaction amount highlights, risk badges, account routing (`nameOrig` $\rightarrow$ `nameDest`), and timestamps.
   - Filterable by `ALL`, `PENDING`, `VERIFIED`, and `ABORTED`.
   - Instant 1-click **Copy OTP** button.
2. **Interactive 2FA Terminal (`/`)**:
   - Integrated directly into the Real-Time Streaming feed.
   - Enter the 6-digit OTP code to **Validate & Proceed** (clears and settles transaction).
   - Click **Abort Transaction** to permanently halt and freeze funds.

---

## 📡 Apache Kafka Real-Time Streaming Pipeline

```
PaySim Dataset ──► Producer (producer.py) ──► Kafka Topic: 'transactions'
                                                    │
                                                    ▼
                                          Consumer (consumer.py)
                                                    │  (Velocity + XGBoost Scoring)
                                                    ▼
                             ┌──────────────────────┴──────────────────────┐
                             ▼                                             ▼
                 SQLite DB (predictions.db)                  Kafka Topic: 'fraud_alerts'
                                                                           │
                                                                           ▼
                                                              Alert Consumer (alert_consumer.py)
```

- **Kafka Broker Configuration**: Apache Kafka 3.7.0 in KRaft mode (no ZooKeeper required).
- **Topics**:
  - `transactions` (3 partitions, replication factor 1)
  - `fraud_alerts` (3 partitions, replication factor 1)
- **Stateful Sliding-Window Tracker**: In-memory rolling dictionary tracking account history across sliding hourly steps.

---

## 📂 Repository File Structure

```
FraudGuard-AI/
├── docker-compose.yml              # Local Apache Kafka cluster (KRaft mode)
├── ml/                             # Offline IEEE-CIS Machine Learning Pipeline
│   ├── data/                       # Dataset directory (train_transaction.csv, train_identity.csv)
│   ├── models/                     # Serialized models & preprocessors
│   │   ├── selected_model.joblib   # Trained XGBoost classifier
│   │   └── selected_preprocessor.joblib # Fitted ColumnTransformer
│   ├── inspect_data.py             # Dataset exploratory data analysis
│   ├── preprocess.py               # Feature transformation & train/test splitting
│   ├── train.py                    # Multi-model training (Logistic Regression, Random Forest, XGBoost)
│   ├── evaluate.py                 # Threshold tuning, ROC-AUC, and model selection
│   ├── predict.py                  # Real-time inference & TreeSHAP attribution engine
│   └── risk_score.py               # Continuous fraud probability to 0-100 risk score mapper
├── backend/                        # FastAPI Backend & REST API
│   ├── app/
│   │   ├── main.py                 # FastAPI application & CORS configuration
│   │   ├── database.py             # SQLite SQLAlchemy engine & session factory
│   │   ├── models.py               # SQLAlchemy ORM database models
│   │   ├── schemas.py              # Pydantic v2 request & response schemas (inc. SHAP)
│   │   ├── routers/
│   │   │   ├── health.py           # Health check router (/health)
│   │   │   ├── prediction.py       # Assessment prediction router (/predict)
│   │   │   ├── transactions.py     # Transaction audit router (/transactions)
│   │   │   └── analytics.py        # Analytics & global SHAP router (/analytics)
│   │   └── services/
│   │       ├── prediction_service.py # ML & TreeSHAP integration bridge
│   │       └── analytics_service.py  # Aggregate metrics & risk distribution queries
│   └── requirements.txt            # Python dependencies for backend
├── streaming/                      # Real-Time Apache Kafka Streaming Engine
│   ├── config.py                   # Streaming parameters, topics, and thresholds
│   ├── requirements.txt            # Kafka & streaming dependencies
│   ├── sliding_window.py           # 24-step stateful rolling window velocity engine
│   ├── feature_pipeline.py         # Balance discrepancy & streaming feature extractor
│   ├── generate_sample_data.py     # PaySim dataset generator
│   ├── train.py                    # PaySim streaming model trainer with SMOTE
│   ├── producer.py                 # Kafka transaction event stream producer
│   ├── consumer.py                 # Kafka scoring consumer & SQLite recorder
│   └── alert_consumer.py           # High-visibility CLI fraud alert monitor
└── frontend/                       # Interactive React 19 + Vite Dashboard
    ├── index.html                  # HTML entry point
    ├── vite.config.ts              # Vite build & proxy configuration
    ├── src/
    │   ├── main.tsx                # React DOM root
    │   ├── App.tsx                 # Root layout, routes, and risk wave animations
    │   ├── context/
    │   │   └── StreamContext.tsx   # Global continuous background Kafka streaming engine & 2FA state
    │   ├── api/
    │   │   ├── client.ts           # Axios HTTP client
    │   │   └── fraud.ts            # API service calls (predict, transactions, analytics, global-shap)
    │   ├── types/
    │   │   └── index.ts            # TypeScript interfaces (Predictions, SHAP, Transactions, Metrics)
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx     # Navigation sidebar & backend health status
    │   │   │   └── TopBar.tsx      # Header bar
    │   │   └── ui/
    │   │       ├── ResultPanel.tsx # Interactive SHAP Feature Attribution & Waterfall Visualizer
    │   │       ├── GaugeChart.tsx  # Canvas-rendered 0-100 risk score speedometer
    │   │       ├── MetricCard.tsx  # Glowing animated KPI metric card
    │   │       ├── ModalCard.tsx   # Expandable deep-dive modal card
    │   │       ├── RiskBadge.tsx   # Color-coded LOW / MEDIUM / HIGH risk tag
    │   │       └── 3d-card.tsx     # Interactive 3D perspective card container
    │   └── pages/
    │       ├── KafkaStream.tsx     # Real-Time Streaming Engine & 2FA Terminal
    │       ├── SecurityCenter.tsx  # 2FA & Security Center (Full-Width OTP Dispatch Vault)
    │       ├── Assessment.tsx      # Manual Assessment & Single Transaction Evaluator
    │       ├── Analytics.tsx       # Analytics, Risk Segmentation & Global SHAP Matrix
    │       └── Transactions.tsx    # Combined Audit Trail & Transaction Table
```

---

## 🚀 Step-by-Step Installation & Run Guide

### Prerequisites
- **Python**: Version `3.10`, `3.11`, or `3.12`
- **Node.js**: Version `18.0+` & `npm`
- **Docker & Docker Compose**: (Optional, for running real Apache Kafka broker)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/FraudGuard-AI.git
cd FraudGuard-AI
```

---

### Step 2: Set Up Python Backend Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
cd ..
```

---

### Step 3: Run the FastAPI Backend Server
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Server**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### Step 4: Set Up and Run the Frontend Dashboard
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- **Web Dashboard**: `http://localhost:5173` (or `http://localhost:5174`)

---

### Step 5: (Optional) Run the Real Apache Kafka Pipeline via Docker
To run the live distributed Kafka cluster:

1. **Start Apache Kafka (KRaft mode)**:
   ```bash
   docker compose up -d
   ```
2. **Start the Alert Consumer (Terminal 1)**:
   ```bash
   cd streaming
   python alert_consumer.py
   ```
3. **Start the Real-Time ML Consumer (Terminal 2)**:
   ```bash
   cd streaming
   python consumer.py
   ```
4. **Start the Transaction Stream Producer (Terminal 3)**:
   ```bash
   cd streaming
   python producer.py --delay 0.05
   ```

---

## 🔌 REST API Endpoints Reference

### 1. `POST /predict`
Evaluates transaction risk, computes exact TreeSHAP feature contributions, and logs the transaction.

#### Request Body Example:
```json
{
  "TransactionAmt": 2500.00,
  "TransactionDT": 86400,
  "ProductCD": "W",
  "card1": 9500,
  "card2": 360,
  "card4": "visa",
  "card6": "debit",
  "addr1": 299,
  "C1": 1.0,
  "C5": 0.0,
  "P_emaildomain": "gmail.com",
  "id_present": 0
}
```

#### Response Example:
```json
{
  "transaction_id": "TXN-8B29F1A4",
  "prediction": 1,
  "prediction_label": "Fraud",
  "fraud_probability": 0.6917,
  "risk_score": 69,
  "risk_level": "MEDIUM",
  "model_used": "XGBoost",
  "shap_explanation": {
    "base_value": 0.0036,
    "contributions": [
      {
        "feature": "num__TransactionAmt",
        "display_name": "Transaction Amount ($)",
        "category": "Amount & Volume",
        "raw_value": "2500.0",
        "shap_value": 0.7572,
        "impact_pct": 28.42,
        "direction": "RISK_INCREASING",
        "description": "Transaction amount ($2500.0) significantly drives fraud probability upward."
      },
      {
        "feature": "num__C5",
        "display_name": "Association Match (C5)",
        "category": "Frequency & Velocity",
        "raw_value": "0.0",
        "shap_value": 0.3962,
        "impact_pct": 14.87,
        "direction": "RISK_INCREASING",
        "description": "Associated identity count (0.0) impact on decision boundary."
      }
    ],
    "top_risk_drivers": [
      "Transaction Amount ($) (Transaction amount ($2500.0) significantly drives fraud probability upward.)"
    ],
    "top_safe_drivers": [
      "Billing Region (addr1) (Billing geographic code (299.0).)"
    ]
  }
}
```

---

### 2. `GET /analytics/global-shap`
Returns global feature importance ranked by gain from the trained XGBoost model.

#### Response Example:
```json
{
  "features": [
    {
      "feature": "cat__ProductCD_C",
      "display_name": "Product Category (C)",
      "category": "Transaction Type",
      "importance_score": 7075.40,
      "importance_pct": 20.07
    },
    {
      "feature": "num__C5",
      "display_name": "Association Match (C5)",
      "category": "Frequency & Velocity",
      "importance_score": 4671.87,
      "importance_pct": 13.25
    },
    {
      "feature": "bin__id_present",
      "display_name": "Digital Identity Record",
      "category": "Identity & Device",
      "importance_score": 3577.91,
      "importance_pct": 10.15
    }
  ]
}
```

---

### 3. Additional Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API health check & connectivity status |
| `GET` | `/transactions` | List past transactions (supports `?risk_level=HIGH&prediction=1`) |
| `GET` | `/transactions/{id}` | Detailed record of a single transaction |
| `GET` | `/analytics/summary` | Total volume, fraud count, fraud rate, and average amounts |
| `GET` | `/analytics/risk-distribution` | Count and percentage breakdown across Low, Medium, and High tiers |

---

## 🖥️ Frontend Dashboard Modules

| Module | Route | Key Features & Purpose |
| :--- | :---: | :--- |
| **Real-Time Streaming Engine** | `/` | Live Kafka stream feed, velocity tracking, burst attack injection, in-stream 2FA validation terminal, and real-time SHAP driver chips. |
| **2FA & Security Center** | `/security` | Full-width OTP Dispatch Vault, 1-click **Copy OTP**, real-time status filters (`ALL`, `PENDING`, `VERIFIED`, `ABORTED`), and transaction amount highlights. |
| **Manual Assessment & XAI** | `/assessment` | Instant single-transaction evaluation with interactive **SHAP Force / Waterfall Visualizer**, Gauge speedometer, and preset loaders. |
| **Analytics & Model Telemetry** | `/analytics` | Real-time portfolio metrics, risk tier donut chart, **Global SHAP Feature Importance Matrix**, and dual-pipeline specs. |
| **Transaction Audit Log** | `/transactions` | Combined audit table merging persistent SQLite records with live in-memory Kafka events, with multi-column sorting and pagination. |

---

## 🛠️ Tech Stack

- **Machine Learning & Analytics**:
  - `XGBoost` (Extreme Gradient Boosting Classifier & native TreeSHAP)
  - `Scikit-Learn` (ColumnTransformer, StandardScaler, OneHotEncoder)
  - `Pandas`, `NumPy`, `Joblib`
  - `Imbalanced-Learn` (SMOTE oversampling)
- **Backend & Streaming**:
  - `FastAPI` (Asynchronous ASGI Web Framework)
  - `SQLAlchemy` & `SQLite` (ORM & Persistence)
  - `Apache Kafka 3.7.0` (KRaft distributed broker)
  - `kafka-python-ng` & `Docker Compose`
- **Frontend & Visualization**:
  - `React 19`, `TypeScript`, `Vite`
  - `Lucide React` (Modern icon set)
  - `Recharts` (Responsive SVG charting)
  - `Framer Motion` & Canvas API (Smooth kinetic transitions & particle waves)

---

## 📄 License & Attribution
Distributed under the **MIT License**. Built for enterprise fraud defense and financial risk intelligence.

