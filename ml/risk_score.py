"""
risk_score.py
=============
Converts a model's fraud probability (0.0 to 1.0) into a human-readable
risk score (0-100) and risk level (LOW / MEDIUM / HIGH).

This is a project-defined risk indicator. It is NOT a bank-approved or
industry-standard score. It is a simple, transparent mapping designed to
make the model output understandable in the dashboard.

Mapping:
    fraud_probability * 100  →  risk_score (integer, 0-100)
    0  – 30                  →  LOW
    31 – 70                  →  MEDIUM
    71 – 100                 →  HIGH
"""


def compute_risk(fraud_probability: float) -> dict:
    """
    Convert a fraud probability into a risk score and level.

    Parameters
    ----------
    fraud_probability : float
        Output from model.predict_proba()[:, 1]. Must be between 0.0 and 1.0.

    Returns
    -------
    dict with keys:
        risk_score  : int   (0 to 100)
        risk_level  : str   ('LOW', 'MEDIUM', or 'HIGH')
    """
    if not (0.0 <= fraud_probability <= 1.0):
        raise ValueError(f"fraud_probability must be between 0 and 1, got: {fraud_probability}")

    # Simple linear mapping: probability 0.87 → score 87
    risk_score = int(round(fraud_probability * 100))

    if risk_score <= 30:
        risk_level = "LOW"
    elif risk_score <= 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
    }


# ── Simple self-test when run directly ────────────────────────────────────────
if __name__ == "__main__":
    print("Risk score mapping examples:")
    print("-" * 40)
    test_probs = [0.05, 0.25, 0.50, 0.72, 0.90, 1.00]
    for p in test_probs:
        result = compute_risk(p)
        print(f"  probability={p:.2f}  →  score={result['risk_score']:>3}  level={result['risk_level']}")
