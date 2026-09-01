# Financial Transaction Fraud Detection and Risk Intelligence Platform

## Overview
This is a final-year academic prototype demonstrating an end-to-end Machine Learning pipeline integrated with a FastAPI backend and a React frontend. The platform evaluates financial transactions in real-time using a trained XGBoost model and provides a comprehensive dashboard for risk intelligence and analytics.

## Architecture Overview
The platform consists of three main modules:
1. **Machine Learning Pipeline (`/ml`)**: Preprocesses the IEEE-CIS Fraud Detection dataset, trains models, and exports the winning model (`XGBoost`) along with its preprocessor.
2. **Backend API (`/backend`)**: A FastAPI application that serves the ML model, handles API requests from the frontend, and stores transaction history in a local SQLite database.
3. **Frontend Dashboard (`/frontend`)**: A React 19 application built with Vite that provides a user-friendly interface to submit transactions, view history, and analyze risk distributions.

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, React Router, Recharts, Tailwind CSS concepts
- **Backend**: Python 3, FastAPI, SQLAlchemy, SQLite, Pydantic
- **Machine Learning**: Scikit-Learn, XGBoost, Pandas, NumPy, Joblib

## Project Structure
```
major-project/
├── ml/                       # ML Pipeline & Inference Scripts
│   ├── models/               # Saved model artifacts (.joblib)
│   ├── predict.py            # Main inference function
│   ├── preprocess.py         # Feature engineering logic
│   ├── risk_score.py         # Risk level logic
│   └── train.py / evaluate.py
├── backend/                  # FastAPI Application
│   ├── app/                  # Routes, schemas, and database setup
│   ├── requirements.txt      # Python dependencies
│   ├── fraud_detection.db    # SQLite Database
│   └── test_api.py           # API endpoint tests
├── frontend/                 # React Dashboard
│   ├── src/                  # React components, pages, API clients
│   └── package.json          # Node dependencies
└── README.md
```

## How the ML Prediction Flow Works
1. The frontend submits a transaction via `POST /predict` containing raw fields (e.g., `TransactionAmt`, `TransactionDT`, `card1`, `ProductCD`).
2. The FastAPI backend receives the request and passes the data dictionary to the ML module (`ml/predict.py`).
3. The ML module internally derives temporal features (`tx_hour`, `tx_day`), coarsens categorical domains, and applies the saved `selected_preprocessor.joblib`.
4. The processed features are fed into `selected_model.joblib` (XGBoost) which outputs a binary prediction and fraud probability.
5. A risk score (0-100) and risk level (`LOW`, `MEDIUM`, `HIGH`) are computed.
6. The backend stores the result in SQLite and returns it to the frontend for display.

## Installation & Setup

### macOS Compatibility Note
If you are running this on macOS (especially Apple Silicon), XGBoost requires `libomp`. Install it using Homebrew:
```bash
HOMEBREW_NO_AUTO_UPDATE=1 brew install libomp
```

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend
Open a terminal, activate the virtual environment, and run:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
API documentation is at `http://localhost:8000/docs`.

### Start the Frontend
Open a new terminal and run:
```bash
cd frontend
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

## Example API Request
**POST /predict**
```json
{
  "TransactionAmt": 450.0,
  "ProductCD": "C",
  "card1": 12345,
  "card4": "mastercard",
  "card6": "credit",
  "P_emaildomain": "yahoo.com",
  "TransactionDT": 86400,
  "id_present": 1,
  "C1": 4
}
```

**Response**
```json
{
  "transaction_id": "TXN-94210404",
  "prediction": 1,
  "prediction_label": "Fraud",
  "fraud_probability": 0.9077,
  "risk_score": 91,
  "risk_level": "HIGH",
  "model_used": "XGBoost"
}
```
