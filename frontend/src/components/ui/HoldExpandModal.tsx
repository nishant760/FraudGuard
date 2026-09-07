import type React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Layers,
  Clock,
  Sparkles,
  Hand,
} from "lucide-react";
import type { TransactionHistoryItem, RiskLevel } from "../../types";
import RiskBadge from "./RiskBadge";
import "./HoldExpandModal.css";

const PRODUCT_LABELS: Record<string, string> = {
  W: "Web / Digital Products",
  H: "Home / Physical Goods",
  C: "Cash / ATM Withdrawal",
  S: "Services",
  R: "Retail / In-Store",
};

export interface HoldExpandModalProps {
  transaction: TransactionHistoryItem | null;
  onClose: () => void;
}

export const HoldExpandModal: React.FC<HoldExpandModalProps> = ({
  transaction,
  onClose,
}) => {
  // Release listener on global window mouseup & touchend
  useEffect(() => {
    const handleRelease = () => {
      if (transaction) {
        onClose();
      }
    };

    window.addEventListener("mouseup", handleRelease);
    window.addEventListener("touchend", handleRelease);
    window.addEventListener("touchcancel", handleRelease);
    window.addEventListener("mouseleave", handleRelease);

    return () => {
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("touchend", handleRelease);
      window.removeEventListener("touchcancel", handleRelease);
      window.removeEventListener("mouseleave", handleRelease);
    };
  }, [transaction, onClose]);

  if (!transaction) return null;

  const isFraud = transaction.prediction === 1;
  const riskLevel = (transaction.risk_level || "LOW") as RiskLevel;

  const formattedDate = (() => {
    try {
      const d = new Date(transaction.created_at);
      return (
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " · " +
        d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      );
    } catch {
      return transaction.created_at;
    }
  })();

  const policyText =
    riskLevel === "LOW"
      ? "Legitimate transaction. Low variance across behavioral risk metrics. Passed automated clearance."
      : riskLevel === "MEDIUM"
      ? "Moderate anomaly detected. Flagged for secondary identity validation or step-up verification."
      : "High-risk fraudulent pattern detected by XGBoost model. Immediate block recommended.";

  return createPortal(
    <div
      className="hold-modal-backdrop"
      onMouseUp={onClose}
      onTouchEnd={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="hold-modal-card"
        onMouseUp={onClose}
        onTouchEnd={onClose}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hold-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {transaction.transaction_id}
              </span>
              <RiskBadge level={riskLevel} size="md" />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="hold-modal-release-hint">
            <Hand size={13} />
            <span>Release to Close</span>
          </div>
        </div>

        {/* Hero Metrics Grid */}
        <div className="hold-metrics-grid">
          <div className="hold-metric-box">
            <span className="hold-metric-label">Amount</span>
            <span className="hold-metric-value" style={{ color: "var(--primary-700)" }}>
              ${transaction.transaction_amount.toFixed(2)}
            </span>
          </div>

          <div className="hold-metric-box">
            <span className="hold-metric-label">Risk Score</span>
            <span
              className="hold-metric-value"
              style={{
                color:
                  riskLevel === "HIGH"
                    ? "var(--risk-high-accent)"
                    : riskLevel === "MEDIUM"
                    ? "var(--risk-medium-accent)"
                    : "var(--risk-low-accent)",
              }}
            >
              {transaction.risk_score} <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
            </span>
          </div>

          <div className="hold-metric-box">
            <span className="hold-metric-label">Verdict</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              {isFraud ? (
                <ShieldAlert size={18} color="var(--risk-high-accent)" />
              ) : (
                <ShieldCheck size={18} color="var(--risk-low-accent)" />
              )}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isFraud ? "var(--risk-high-text)" : "var(--risk-low-text)",
                }}
              >
                {isFraud ? "Fraud" : "Legitimate"}
              </span>
            </div>
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="hold-details-section">
          <div className="hold-detail-row">
            <span className="hold-detail-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={14} color="var(--text-muted)" /> Product Type
            </span>
            <span className="hold-detail-value">
              {PRODUCT_LABELS[transaction.ProductCD || ""] || transaction.ProductCD || "Web Product"} ({transaction.ProductCD || "W"})
            </span>
          </div>

          <div className="hold-detail-row">
            <span className="hold-detail-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CreditCard size={14} color="var(--text-muted)" /> Card Details
            </span>
            <span className="hold-detail-value" style={{ textTransform: "capitalize" }}>
              {transaction.card4 || "Visa"} · {transaction.card6 || "Debit"}
            </span>
          </div>

          <div className="hold-detail-row">
            <span className="hold-detail-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="var(--text-muted)" /> ML Inference Engine
            </span>
            <span className="hold-detail-value">
              {transaction.model_used || "XGBoost Classifier"}
            </span>
          </div>
        </div>

        {/* Intelligence Policy Box */}
        <div
          style={{
            background:
              riskLevel === "HIGH"
                ? "var(--risk-high-bg)"
                : riskLevel === "MEDIUM"
                ? "var(--risk-medium-bg)"
                : "var(--risk-low-bg)",
            border: `1px solid ${
              riskLevel === "HIGH"
                ? "var(--risk-high-border)"
                : riskLevel === "MEDIUM"
                ? "var(--risk-medium-border)"
                : "var(--risk-low-border)"
            }`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 12.5,
            color:
              riskLevel === "HIGH"
                ? "var(--risk-high-text)"
                : riskLevel === "MEDIUM"
                ? "var(--risk-medium-text)"
                : "var(--risk-low-text)",
            lineHeight: 1.5,
          }}
        >
          <strong>Security Action: </strong>
          {policyText}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HoldExpandModal;
