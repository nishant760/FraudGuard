# 🛡️ FraudGuard-AI

## Financial Fraud Detection & Real-Time Risk Intelligence Platform

**FraudGuard-AI** is a full-stack financial fraud detection and risk intelligence platform designed to identify suspicious transactions, evaluate financial risk in real time, and provide explainable insights behind every prediction.

The platform combines **Machine Learning, Explainable AI, Apache Kafka, FastAPI, React, SQLite, and adaptive multi-factor authentication** into a unified fraud monitoring system.

It supports two complementary transaction-processing pipelines:

* **IEEE-CIS Fraud Detection** for card-not-present and e-commerce transactions
* **PaySim** for high-volume mobile-money transaction streaming

---

## 🚀 Key Features

### 🤖 Machine Learning Fraud Detection

* XGBoost-based fraud classification
* Separate batch and real-time streaming pipelines
* Transaction-level fraud probability prediction
* Continuous risk score from **0–100**
* Risk categorization into **LOW, MEDIUM, and HIGH**

### 🔍 Explainable AI

FraudGuard-AI uses **TreeSHAP** to explain individual predictions.

For every transaction, the system identifies:

* Features increasing fraud risk
* Features reducing fraud risk
* Individual feature contribution values
* Global model feature importance
* Risk drivers and safety factors

This makes the prediction process more transparent instead of treating the ML model as a black box.

### ⚡ Real-Time Kafka Streaming

The PaySim pipeline uses **Apache Kafka** for event-driven transaction processing.

```text
PaySim Dataset
      │
      ▼
Kafka Producer
      │
      ▼
transactions Topic
      │
      ▼
Kafka Consumer
      │
      ├── Sliding Window Analysis
      ├── Feature Engineering
      ├── ML Prediction
      └── Risk Scoring
              │
              ▼
       ┌──────┴──────┐
       ▼             ▼
   SQLite DB    fraud_alerts
                     │
                     ▼
              Alert Consumer
```

The streaming pipeline includes:

* Kafka Producer
* Kafka Consumer
* `transactions` topic
* `fraud_alerts` topic
* Stateful sliding-window tracking
* Real-time fraud scoring
* Fraud alert generation

### 📊 Sliding-Window Behaviour Analysis

FraudGuard-AI maintains a **24-step rolling transaction window** for account-level behavioural analysis.

The system tracks:

* Number of transactions
* Total transaction amount
* Average transaction amount
* Transaction velocity
* Balance discrepancies

This helps identify abnormal transaction bursts and suspicious account behaviour.

### 🔐 Adaptive Risk-Based 2FA

Security actions are determined dynamically according to the calculated risk score.

| Risk Level    |  Score | Security Action                                  |
| ------------- | -----: | ------------------------------------------------ |
| 🟢 **LOW**    |   0–30 | Automatic approval                               |
| 🟡 **MEDIUM** |  31–70 | 6-digit OTP / 2FA verification                   |
| 🔴 **HIGH**   | 71–100 | Critical verification and transaction protection |

Medium- and high-risk transactions require additional verification before completion.

### 📈 Interactive Risk Dashboard

The React dashboard provides:

* Real-time transaction monitoring
* Manual transaction assessment
* Risk-score visualization
* SHAP explanations
* Transaction history
* Fraud analytics
* Model telemetry
* 2FA security monitoring
* Risk distribution analysis

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────────┐
                         │   Transaction Sources   │
                         │                         │
                         │ Web UI / REST API       │
                         │ PaySim Streaming Data   │
                         └────────────┬────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌──────────────────┐                ┌──────────────────┐
          │ FastAPI Backend  │                │  Kafka Producer  │
          │ Batch Assessment │                │   PaySim Data    │
          └────────┬─────────┘                └────────┬─────────┘
                   │                                   │
                   │                                   ▼
                   │                         ┌──────────────────┐
                   │                         │ Kafka Broker     │
                   │                         │ KRaft Mode       │
                   │                         └────────┬─────────┘
                   │                                  │
                   │                                  ▼
                   │                         ┌──────────────────┐
                   │                         │ Kafka Consumer   │
                   │                         │                  │
                   │                         │ Sliding Window  │
                   │                         │ Feature Engine  │
                   │                         │ ML Scoring      │
                   │                         └────────┬─────────┘
                   │                                  │
                   └────────────────┬─────────────────┘
                                    ▼
                         ┌─────────────────────────┐
                         │ ML & Explainability    │
                         │                         │
                         │ XGBoost                │
                         │ TreeSHAP               │
                         │ Risk Scoring           │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ Adaptive Risk Engine    │
                         │                         │
                         │ LOW → Approve          │
                         │ MEDIUM → 2FA           │
                         │ HIGH → Protection      │
                         └────────────┬────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
              ┌─────────────────┐          ┌─────────────────┐
              │ SQLite Database │          │ Security / 2FA  │
              │ Audit & History │          │ OTP Management  │
              └────────┬────────┘          └────────┬────────┘
                       │                             │
                       └──────────────┬──────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │ React Frontend         │
                         │ Risk Intelligence UI   │
                         └─────────────────────────┘
```

---

# 🧠 Machine Learning Pipeline

## IEEE-CIS Fraud Detection

The IEEE-CIS pipeline is designed for card-not-present and e-commerce transaction fraud detection.

### Model

**XGBoost Classifier**

### Reported Performance

| Metric            |     Result |
| ----------------- | ---------: |
| ROC-AUC           | **0.8587** |
| Recall            | **72.34%** |
| Precision         | **68.12%** |
| Inference Latency | **< 4 ms** |

### Feature Engineering

The pipeline derives behavioural and transaction-level features such as:

* Log-transformed transaction amount
* Transaction hour and day
* Email-domain grouping
* Frequency counters
* Association tracking
* Digital identity presence

---

# 💳 PaySim Streaming Pipeline

The PaySim pipeline is designed to simulate high-volume mobile-money transaction processing.

### Key Features

**Balance discrepancy**

```text
errorBalanceOrig =
(oldbalanceOrg - amount) - newbalanceOrig
```

```text
errorBalanceDest =
(oldbalanceDest + amount) - newbalanceDest
```

### Sliding-Window Features

The streaming engine maintains a rolling 24-step window and calculates:

```text
orig_txn_count_window
orig_amount_sum_window
orig_amount_avg_window
```

These features provide behavioural context beyond the current transaction.

---

# 🔍 Explainable AI with TreeSHAP

FraudGuard-AI integrates **TreeSHAP (SHapley Additive exPlanations)** with the XGBoost model.

The prediction can be represented as:

```text
f(x) = φ₀ + Σ φᵢ(x)
```

Where:

* `φ₀` represents the base model output
* `φᵢ(x)` represents the contribution of feature `i`
* Positive contributions increase fraud risk
* Negative contributions decrease fraud risk

The frontend visualizes these contributions through interactive risk-driver and safety-factor components.

### Example

```text
Risk Increasing Factors
────────────────────────
Transaction Amount       +0.75
Velocity                  +0.32
Missing Identity Record   +0.18

Risk Reducing Factors
──────────────────────
Known Email Provider      -0.14
Billing Region            -0.29
```

This allows analysts to understand **why** a transaction was classified as risky.

---

# 🔐 Adaptive Security Engine

FraudGuard-AI converts fraud probability into a normalized **0–100 risk score**.

```text
Fraud Probability
        │
        ▼
   Risk Scoring
        │
        ▼
┌───────────────────────┐
│ 0 – 30   → LOW        │
│ 31 – 70  → MEDIUM     │
│ 71 – 100 → HIGH       │
└───────────────────────┘
```

The resulting risk tier determines the appropriate security response.

### LOW

Transaction proceeds automatically.

### MEDIUM

The transaction enters a verification state and requires OTP-based 2FA.

### HIGH

The transaction requires critical verification and additional transaction protection.

---

# 📡 Apache Kafka Architecture

FraudGuard-AI uses **Apache Kafka 3.7.0 in KRaft mode**, eliminating the need for ZooKeeper.

### Kafka Topics

| Topic          | Partitions | Purpose                     |
| -------------- | ---------: | --------------------------- |
| `transactions` |          3 | Incoming transaction events |
| `fraud_alerts` |          3 | Fraud and risk alerts       |

### Streaming Components

```text
producer.py
     │
     ▼
transactions
     │
     ▼
consumer.py
     │
     ├── Feature Engineering
     ├── Sliding Window
     ├── ML Prediction
     └── Risk Scoring
     │
     ├──────────────► predictions.db
     │
     ▼
fraud_alerts
     │
     ▼
alert_consumer.py
```

---

# 🔌 REST API

The backend is implemented using **FastAPI** and exposes RESTful endpoints for transaction prediction, analytics, health monitoring, and transaction history.

### Main Endpoints

| Method | Endpoint                       | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| `GET`  | `/health`                      | Backend health check                 |
| `POST` | `/predict`                     | Predict transaction fraud risk       |
| `GET`  | `/transactions`                | Retrieve transaction history         |
| `GET`  | `/transactions/{id}`           | Retrieve transaction details         |
| `GET`  | `/analytics/summary`           | Retrieve overall transaction metrics |
| `GET`  | `/analytics/risk-distribution` | Retrieve risk-level distribution     |
| `GET`  | `/analytics/global-shap`       | Retrieve global feature importance   |

### API Documentation

When the backend is running:

```text
http://localhost:8000/docs
```

FastAPI automatically provides interactive Swagger API documentation.

---

# 🖥️ Frontend Modules

| Module                  | Route           | Purpose                                  |
| ----------------------- | --------------- | ---------------------------------------- |
| **Real-Time Streaming** | `/`             | Live Kafka transactions and 2FA handling |
| **Security Center**     | `/security`     | OTP and security monitoring              |
| **Manual Assessment**   | `/assessment`   | Individual transaction analysis          |
| **Analytics**           | `/analytics`    | Risk metrics and model insights          |
| **Transactions**        | `/transactions` | Historical transaction audit             |

---

# 📂 Project Structure

```text
FraudGuard-AI/
│
├── ml/
│   ├── data/
│   ├── models/
│   ├── inspect_data.py
│   ├── preprocess.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   └── risk_score.py
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   ├── prediction.py
│   │   │   ├── transactions.py
│   │   │   └── analytics.py
│   │   └── services/
│   │       ├── prediction_service.py
│   │       └── analytics_service.py
│   └── requirements.txt
│
├── streaming/
│   ├── config.py
│   ├── sliding_window.py
│   ├── feature_pipeline.py
│   ├── generate_sample_data.py
│   ├── train.py
│   ├── producer.py
│   ├── consumer.py
│   └── alert_consumer.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Installation & Setup

## Prerequisites

* Python `3.10+`
* Node.js `18+`
* npm
* Docker & Docker Compose
* Apache Kafka

---

## 1. Clone the Repository

```bash
git clone https://github.com/nishant760/FraudGuard.git
cd FraudGuard
```

---

## 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 4. Start Kafka

From the project root:

```bash
docker compose up -d
```

Then start the streaming components in separate terminals.

### Alert Consumer

```bash
cd streaming
python alert_consumer.py
```

### ML Consumer

```bash
cd streaming
python consumer.py
```

### Transaction Producer

```bash
cd streaming
python producer.py --delay 0.05
```

---

# 🛠️ Technology Stack

### Machine Learning

* Python
* XGBoost
* Scikit-Learn
* Pandas
* NumPy
* Joblib
* Imbalanced-Learn / SMOTE
* TreeSHAP

### Backend

* FastAPI
* Pydantic
* SQLAlchemy
* SQLite
* REST API

### Real-Time Processing

* Apache Kafka
* Kafka KRaft
* kafka-python-ng
* Docker
* Docker Compose

### Frontend

* React
* TypeScript
* Vite
* Axios
* Recharts
* Lucide React
* Framer Motion
* HTML5 Canvas

---

# 🔄 End-to-End Transaction Flow

```text
Transaction
     │
     ▼
Data Ingestion
     │
     ▼
Feature Engineering
     │
     ├───────────────┐
     │               │
     ▼               ▼
Batch Pipeline   Kafka Pipeline
     │               │
     │          Sliding Window
     │               │
     └───────┬───────┘
             ▼
       XGBoost Model
             │
             ▼
       Fraud Probability
             │
             ▼
        Risk Score
        0 ─────── 100
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
      LOW  MEDIUM  HIGH
       │     │      │
       ▼     ▼      ▼
    Approve 2FA   Protection
             │
             ▼
        TreeSHAP
       Explanation
             │
             ▼
       SQLite / Kafka
             │
             ▼
      React Dashboard
```

---

# 🎯 Project Objectives

FraudGuard-AI aims to provide a comprehensive fraud intelligence solution capable of:

* Detecting potentially fraudulent financial transactions
* Processing transactions in real time
* Identifying abnormal behavioural patterns
* Generating continuous risk scores
* Explaining ML predictions using XAI
* Applying risk-based authentication
* Maintaining transaction audit history
* Providing real-time fraud monitoring and analytics

---

# 📌 Highlights

> **Real-Time Detection** — Kafka-powered transaction streaming and scoring.

> **Explainable Predictions** — TreeSHAP-based transaction-level explanations.

> **Adaptive Security** — Risk-based authentication and transaction protection.

> **Behavioural Intelligence** — Sliding-window transaction velocity analysis.

> **Full-Stack Architecture** — React frontend, FastAPI backend, ML services, Kafka streaming, and persistent storage.

---

# 📄 License

This project is distributed under the **MIT License**.

---

## 👨‍💻 Author

**Nishant**

Built as a full-stack Financial Fraud Detection and Risk Intelligence Platform integrating Machine Learning, Explainable AI, Real-Time Streaming, and Adaptive Security.
