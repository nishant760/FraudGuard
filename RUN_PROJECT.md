# How to Run the Fraud Detection Project

Welcome! This guide explains exactly how to start and test the **FraudGuard AI: Real-Time Machine Learning Fraud Detection and Risk Intelligence Platform**.

## 1. Project Structure
- `ml/`: Contains the trained XGBoost model and preprocessing pipeline.
- `backend/`: A FastAPI Python server that connects to the ML model and a SQLite database.
- `frontend/`: A React + Vite user interface.

## 2. Prerequisites
Ensure you have the following installed on your MacBook (Apple Silicon):
- **Python 3.10+**
- **Node.js 20+** and **npm**
- **libomp** (required by XGBoost on macOS). You can install this via Homebrew:
  ```bash
  HOMEBREW_NO_AUTO_UPDATE=1 brew install libomp
  ```

---

## 3. How to Start the Project

### Start the Backend
1. Open **Terminal** and navigate to the backend folder:
   ```bash
   cd "path/to/major project/backend"
   ```
2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
   *(If `venv` doesn't exist, create it: `python3 -m venv venv` and install dependencies: `pip install -r requirements.txt`)*
3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Start the Frontend
1. Open a **NEW Terminal window**.
2. Navigate to the frontend folder:
   ```bash
   cd "path/to/major project/frontend"
   ```
3. Start the React server:
   ```bash
   npm run dev
   ```

### Important URLs
- **Frontend Dashboard:** http://localhost:5173
- **Backend API Docs:** http://127.0.0.1:8000/docs

---

## 4. Demonstration Workflow

Follow these exact steps during your university presentation:

1. **Welcome Screen:** Open http://localhost:5173. You will see a polished welcome screen. Click "Enter Dashboard".
2. **Normal Transaction:** On the Real-Time Assessment page, click **Reset** (which fills in legitimate test data) and click **Run Assessment**.
3. **Fraud Transaction:** Click the **High Risk Preset** button, then click **Run Assessment**.
4. **Transaction History:** Navigate to the Transaction History tab. Show the professor that both transactions were recorded in the database.
5. **Analytics:** Navigate to Analytics & Models. Show that the total counts and pie chart reflect the real data just processed.

---

## 5. Understanding the System

### What the Input Fields Mean
The inputs exactly match the 11 required features used to engineer the final 14 ML features:
- **TransactionAmt:** The dollar amount of the transaction.
- **ProductCD:** Dataset-defined product category (W, H, C, S, R).
- **card1, card2, card4, card6:** Raw card network and type information.
- **addr1:** Billing region.
- **C1, C5:** Frequency/count metrics from the dataset.
- **P_emaildomain:** Purchaser email domain (e.g., gmail, protonmail).
- **id_present:** Whether an identity record was found during the transaction.

### What the Output Means
- **Fraud Probability:** The raw probability (0.0 to 1.0) output by the XGBoost model.
- **Risk Score:** A normalized 0–100 scale derived from the probability.
- **Risk Level:** LOW (0–30), MEDIUM (31–70), or HIGH (71–100).
- **Verdict:** Legitimate (0) or Fraud (1).

### How "Refresh Stream" Works
The "Refresh Stream" button in the Transaction History tab manually triggers an API request to the backend SQLite database to fetch the most recently evaluated transactions.

### How Analytics is Calculated
Analytics are mathematically derived from real stored transactions:
- **Fraud Rate:** `(Total Fraud Predictions / Total Transactions) × 100`
- **Average Transaction:** The average monetary amount of all stored transactions.
- **Risk Distribution:** A live aggregate of all LOW, MEDIUM, and HIGH risk levels stored in the database.
