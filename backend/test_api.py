"""
Automated Endpoint Testing Script for Fraud Detection Backend API
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_all_endpoints():
    print("=" * 60)
    print("STARTING BACKEND API ENDPOINT TESTS")
    print("=" * 60)

    # 1. Test GET /health
    print("\n[1] Testing GET /health ...")
    res = client.get("/health")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
    print("--> PASS")

    # 2. Test POST /predict with multiple sample transactions
    print("\n[2] Testing POST /predict ...")
    samples = [
        {
            "TransactionAmt": 50.0,
            "ProductCD": "W",
            "card1": 10001,
            "card4": "visa",
            "card6": "debit",
            "P_emaildomain": "gmail.com",
            "TransactionDT": 86400,
            "id_present": 0,
            "C1": 1
        },
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
        },
        {
            "TransactionAmt": 2500.0,
            "ProductCD": "R",
            "card1": 99999,
            "card4": "discover",
            "card6": "credit",
            "P_emaildomain": "protonmail.com",
            "TransactionDT": 86400,
            "id_present": 1,
            "C1": 15
        }
    ]

    created_txn_ids = []
    for idx, sample in enumerate(samples, 1):
        res = client.post("/predict", json=sample)
        data = res.json()
        print(f"\nSample {idx} - Amount: ${sample['TransactionAmt']}")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {data}")
        assert res.status_code == 200
        assert "transaction_id" in data
        assert "risk_level" in data
        assert "fraud_probability" in data
        created_txn_ids.append(data["transaction_id"])

    print("--> PASS")

    # 3. Test GET /transactions
    print("\n[3] Testing GET /transactions ...")
    res = client.get("/transactions")
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print(f"Total Transactions Retrieved: {len(data)}")
    if data:
        print(f"Sample First Transaction: {data[0]}")
    assert res.status_code == 200
    assert len(data) >= len(samples)
    print("--> PASS")

    # 4. Test GET /transactions with filter
    print("\n[4] Testing GET /transactions?prediction=1 ...")
    res = client.get("/transactions?prediction=1")
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print(f"Fraud Transactions Found: {len(data)}")
    assert res.status_code == 200
    for txn in data:
        assert txn["prediction"] == 1
    print("--> PASS")

    # 5. Test GET /transactions/{transaction_id}
    print(f"\n[5] Testing GET /transactions/{created_txn_ids[0]} ...")
    res = client.get(f"/transactions/{created_txn_ids[0]}")
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print(f"Transaction Detail: {data}")
    assert res.status_code == 200
    assert data["transaction_id"] == created_txn_ids[0]
    print("--> PASS")

    # 6. Test GET /transactions/TXN-NONEXISTENT (404 check)
    print("\n[6] Testing GET /transactions/TXN-NONEXISTENT (404 expected) ...")
    res = client.get("/transactions/TXN-NONEXISTENT")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.json()}")
    assert res.status_code == 404
    assert res.json() == {"detail": "Transaction not found"}
    print("--> PASS")

    # 7. Test GET /analytics/summary
    print("\n[7] Testing GET /analytics/summary ...")
    res = client.get("/analytics/summary")
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print(f"Summary: {data}")
    assert res.status_code == 200
    assert "total_transactions" in data
    assert "total_fraud" in data
    assert "total_legitimate" in data
    assert "fraud_rate" in data
    assert "avg_risk_score" in data
    assert "avg_transaction_amount" in data
    print("--> PASS")

    # 8. Test GET /analytics/risk-distribution
    print("\n[8] Testing GET /analytics/risk-distribution ...")
    res = client.get("/analytics/risk-distribution")
    data = res.json()
    print(f"Status Code: {res.status_code}")
    print(f"Risk Distribution: {data}")
    assert res.status_code == 200
    assert "distribution" in data
    assert isinstance(data["distribution"], list)
    print("--> PASS")

    print("\n" + "=" * 60)
    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_all_endpoints()
