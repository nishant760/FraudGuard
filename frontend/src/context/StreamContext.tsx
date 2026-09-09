import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type { StreamTransaction } from '../types';
import { triggerRiskDots } from '../lib/dotsEvent';

// Customer account pool — each account has a real name, card type, card network and a starting balance
const CUSTOMER_ACCOUNTS: Record<string, { name: string; card_type: 'credit' | 'debit'; card_network: 'Visa' | 'Mastercard' | 'Amex' | 'Discover'; balance: number }> = {
  'C10293847': { name: 'Alex M. Johnson',    card_type: 'debit',  card_network: 'Visa',       balance: 124500.00 },
  'C89234120': { name: 'Priya Sharma',       card_type: 'credit', card_network: 'Mastercard', balance: 48200.00  },
  'C49201948': { name: 'Michael Torres',     card_type: 'debit',  card_network: 'Visa',       balance: 9800.00   },
  'C99283716': { name: 'Sandra Wu',          card_type: 'credit', card_network: 'Amex',       balance: 31500.00  },
  'C55192837': { name: 'James Okafor',       card_type: 'debit',  card_network: 'Discover',   balance: 7200.00   },
  'C12093847': { name: 'Laura Bianchi',      card_type: 'credit', card_network: 'Visa',       balance: 62100.00  },
  'C77283940': { name: 'Raj Patel',          card_type: 'debit',  card_network: 'Mastercard', balance: 15300.00  },
  'C33849102': { name: 'Emily Nakamura',     card_type: 'credit', card_network: 'Amex',       balance: 88750.00  },
};

// Merchant/destination account labels
const DEST_LABELS: Record<string, string> = {
  'C90182736': 'John K. Richards',
  'M82736451': 'Amazon Merchant',
  'C48291039': 'Rachel Gomez',
  'M19283746': 'Shopify Store',
  'C66192837': 'David Lee',
  'M99283741': 'Netflix Services',
  'C11029384': 'Fatima Al-Hassan',
  'C44910293': 'Thomas Müller',
};

const NAMES_ORIG = Object.keys(CUSTOMER_ACCOUNTS);
const NAMES_DEST = Object.keys(DEST_LABELS);

const TYPES = ['TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT'];

export interface OtpNotification {
  id: string;
  txnId: string;
  amount: number;
  type: string;
  account: string;
  otpCode: string;
  riskLevel: string;
  timestamp: string;
}

interface StreamContextType {
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  speedMs: number;
  setSpeedMs: React.Dispatch<React.SetStateAction<number>>;
  transactions: StreamTransaction[];
  selectedTxn: StreamTransaction | null;
  setSelectedTxn: React.Dispatch<React.SetStateAction<StreamTransaction | null>>;
  totalCount: number;
  fraudCount: number;
  totalVolume: number;
  lastLatency: number;
  activeStep: number;
  notifications: OtpNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  resendOtpNotification: (txnId: string) => void;
  handleInjectFraud: () => void;
  handleInjectNormal: () => void;
  handleClearHistory: () => void;
  validateOtp: (txnId: string, inputOtp: string) => boolean;
  abortTransaction: (txnId: string) => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(1500);
  const [transactions, setTransactions] = useState<StreamTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<StreamTransaction | null>(null);
  const [notifications, setNotifications] = useState<OtpNotification[]>([]);

  // Aggregate stats across continuous stream
  const [totalCount, setTotalCount] = useState<number>(0);
  const [fraudCount, setFraudCount] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [lastLatency, setLastLatency] = useState<number>(1.4);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Velocity state
  const accountHistory = useRef<Record<string, { step: number; amount: number }[]>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef<number>(1);

  const generateTransaction = (isFraudAttack = false): StreamTransaction => {
    if (Math.random() > 0.75) {
      stepRef.current += 1;
      setActiveStep(stepRef.current);
    }
    const step = stepRef.current;
    const type = isFraudAttack
      ? Math.random() > 0.5 ? 'TRANSFER' : 'CASH_OUT'
      : TYPES[Math.floor(Math.random() * TYPES.length)];

    // Fraud attacks rotate across ALL customer accounts — real-world: any account can be compromised
    const nameOrig = NAMES_ORIG[Math.floor(Math.random() * NAMES_ORIG.length)];
    const nameDest = isFraudAttack ? 'C66667777' : NAMES_DEST[Math.floor(Math.random() * NAMES_DEST.length)];

    const origProfile = CUSTOMER_ACCOUNTS[nameOrig];
    const card_network = origProfile?.card_network ?? 'Visa';
    const accountBalance = origProfile?.balance ?? 5000;

    // Realistic amount: for normal txns, within 40% of balance; for fraud, can exceed it
    const maxNormal = Math.min(accountBalance * 0.4, 2000);
    const amount = isFraudAttack
      ? Math.round((accountBalance * 0.85 + Math.random() * accountBalance * 1.3) * 100) / 100
      : Math.round((25 + Math.random() * maxNormal) * 100) / 100;

    // ── Credit card auto-assignment ──────────────────────────────────────────
    // If the transaction amount exceeds the account's base balance (credit limit scenario)
    // → automatically treat as a credit card transaction (credit lines allow overspend).
    // Otherwise, respect the customer's configured card type.
    const card_type: 'credit' | 'debit' = amount > accountBalance
      ? 'credit'
      : (origProfile?.card_type ?? 'debit');

    // Balance: for normal txns, ensure oldbalanceOrg >= amount (no overdraft on debit)
    // For fraud attacks or credit txns, balance can start equal to account baseline
    const oldbalanceOrg = (isFraudAttack || card_type === 'credit')
      ? accountBalance
      : Math.round((amount + Math.random() * Math.min(accountBalance - amount, 5000)) * 100) / 100;
    const newbalanceOrig = card_type === 'credit'
      ? Math.round((oldbalanceOrg - amount) * 100) / 100   // can go negative (credit debt)
      : Math.max(0, Math.round((oldbalanceOrg - amount) * 100) / 100);
    const oldbalanceDest = Math.round(Math.random() * 8000 * 100) / 100;
    const newbalanceDest = Math.round((oldbalanceDest + amount) * 100) / 100;

    // 24-step sliding window velocity tracking
    if (!accountHistory.current[nameOrig]) {
      accountHistory.current[nameOrig] = [];
    }
    accountHistory.current[nameOrig].push({ step, amount });
    const recent = accountHistory.current[nameOrig].filter((t) => step - t.step <= 24);
    accountHistory.current[nameOrig] = recent;

    const orig_txn_count_window = recent.length;
    const orig_amount_sum_window = recent.reduce((sum, t) => sum + t.amount, 0);

    // Discrepancy calculations
    const errorBalanceOrig = (oldbalanceOrg - amount) - newbalanceOrig;
    const errorBalanceDest = (oldbalanceDest + amount) - newbalanceDest;

    // Real-Time PaySim XGBoost Scorer Simulation
    let fraudProb = 0.02;
    const shap_drivers: string[] = [];

    if (type === 'TRANSFER' || type === 'CASH_OUT') {
      // 1. Large Account Sweep / High Amount Anomaly
      if (isFraudAttack || amount >= accountBalance * 0.65) {
        fraudProb += 0.45;
        shap_drivers.push(`Large Sweep ($${Math.round(amount).toLocaleString()}) (+0.45)`);
      }
      // 2. Account Balance Drain / Wipeout
      if (oldbalanceOrg > 0 && newbalanceOrig <= 0) {
        fraudProb += 0.30;
        shap_drivers.push('Total Account Balance Wipeout (+0.30)');
      }
      // 3. Ledger Discrepancy / Unbalanced Transfer
      if (Math.abs(errorBalanceDest) > 10.0 || Math.abs(errorBalanceOrig) > 10.0) {
        fraudProb += 0.18;
        shap_drivers.push('Ledger Discrepancy (+0.18)');
      }
      // 4. Velocity Burst
      if (orig_txn_count_window >= 3) {
        fraudProb += 0.15;
        shap_drivers.push(`Velocity Burst (${orig_txn_count_window} txns/window) (+0.15)`);
      }
    } else if (type === 'PAYMENT' || type === 'DEBIT') {
      // Slight risk for high amount or rapid transactions
      if (orig_txn_count_window >= 4) {
        fraudProb += 0.35;
        shap_drivers.push(`High Transaction Frequency (${orig_txn_count_window} txns/window) (+0.35)`);
      }
    }

    if (shap_drivers.length === 0) {
      shap_drivers.push('Standard Baseline Velocity (-0.38)');
    }

    // Natural variation
    fraudProb = Math.min(0.99, Math.max(0.005, fraudProb + (Math.random() * 0.04 - 0.02)));

    const isFraud = fraudProb >= 0.50 ? 1 : 0;
    const riskScore = Math.round(fraudProb * 100);
    const riskLevel = riskScore >= 71 ? 'HIGH' : riskScore >= 31 ? 'MEDIUM' : 'LOW';
    const txnId = `TXN-${step}-${Math.floor(100000 + Math.random() * 900000)}`;
    const latency_ms = parseFloat((1.2 + Math.random() * 0.7).toFixed(1));

    // 2FA Security logic
    const isAuthRequired = riskLevel === 'MEDIUM' || riskLevel === 'HIGH';
    const auth_status = isAuthRequired ? 'PENDING_2FA' : 'AUTO_APPROVED';
    const otp_code = isAuthRequired ? (Math.floor(100000 + Math.random() * 900000)).toString() : undefined;

    return {
      txn_id: txnId,
      step,
      type,
      amount,
      nameOrig,
      nameDest,
      oldbalanceOrg,
      newbalanceOrig,
      oldbalanceDest,
      newbalanceDest,
      errorBalanceOrig,
      errorBalanceDest,
      orig_txn_count_window,
      orig_amount_sum_window,
      fraud_probability: parseFloat(fraudProb.toFixed(4)),
      risk_score: riskScore,
      risk_level: riskLevel,
      is_fraud_predicted: isFraud as 0 | 1,
      latency_ms,
      timestamp: new Date().toLocaleTimeString(),
      otp_code,
      auth_status,
      shap_drivers,
      card_type,
      card_network,
    };
  };




  const processIncomingTransaction = (txn: StreamTransaction) => {
    setTransactions((prev) => [txn, ...prev.slice(0, 49)]);
    setTotalCount((prev) => prev + 1);
    if (txn.is_fraud_predicted === 1) {
      setFraudCount((prev) => prev + 1);
      triggerRiskDots(txn.risk_level);
    }
    setTotalVolume((prev) => prev + txn.amount);
    setLastLatency(txn.latency_ms);

    setSelectedTxn((prev) => (prev ? prev : txn));
    if (txn.otp_code && (txn.risk_level === 'MEDIUM' || txn.risk_level === 'HIGH')) {
      setSelectedTxn(txn);
      const newNotif: OtpNotification = {
        id: Math.random().toString(),
        txnId: txn.txn_id,
        amount: txn.amount,
        type: txn.type,
        account: txn.nameOrig,
        otpCode: txn.otp_code,
        riskLevel: txn.risk_level,
        timestamp: new Date().toLocaleTimeString(),
      };
      // Keep up to 4 notifications in the visual stack
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.txnId !== txn.txn_id).slice(0, 3)]);
    }
  };

  // Persistent live streaming background loop
  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        const isAttack = Math.random() < 0.15;
        const txn = generateTransaction(isAttack);
        processIncomingTransaction(txn);
      }, speedMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming, speedMs]);

  const handleInjectFraud = () => {
    const txn = generateTransaction(true);
    processIncomingTransaction(txn);
  };

  const handleInjectNormal = () => {
    const txn = generateTransaction(false);
    processIncomingTransaction(txn);
  };

  const handleClearHistory = () => {
    setTransactions([]);
    setSelectedTxn(null);
    setNotifications([]);
    setTotalCount(0);
    setFraudCount(0);
    setTotalVolume(0);
    accountHistory.current = {};
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const resendOtpNotification = (txnId: string) => {
    const txn = transactions.find((t) => t.txn_id === txnId);
    if (txn && txn.otp_code) {
      const newNotif: OtpNotification = {
        id: Math.random().toString(),
        txnId: txn.txn_id,
        amount: txn.amount,
        type: txn.type,
        account: txn.nameOrig,
        otpCode: txn.otp_code,
        riskLevel: txn.risk_level,
        timestamp: new Date().toLocaleTimeString(),
      };
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.txnId !== txnId).slice(0, 3)]);
    }
  };

  const validateOtp = (txnId: string, inputOtp: string): boolean => {
    let success = false;
    const cleanInput = inputOtp.trim();

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.txn_id === txnId) {
          if (t.otp_code === cleanInput) {
            success = true;
            return { ...t, auth_status: 'APPROVED_2FA' };
          }
        }
        return t;
      })
    );

    setSelectedTxn((prev) => {
      if (prev && prev.txn_id === txnId) {
        if (prev.otp_code === cleanInput) {
          return { ...prev, auth_status: 'APPROVED_2FA' };
        }
      }
      return prev;
    });

    if (success) {
      setNotifications((prev) => prev.filter((n) => n.txnId !== txnId));
    }

    return success;
  };

  const abortTransaction = (txnId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.txn_id === txnId) {
          return { ...t, auth_status: 'ABORTED' };
        }
        return t;
      })
    );

    setSelectedTxn((prev) => {
      if (prev && prev.txn_id === txnId) {
        return { ...prev, auth_status: 'ABORTED' };
      }
      return prev;
    });

    setNotifications((prev) => prev.filter((n) => n.txnId !== txnId));
  };

  const value = useMemo(
    () => ({
      isStreaming,
      setIsStreaming,
      speedMs,
      setSpeedMs,
      transactions,
      selectedTxn,
      setSelectedTxn,
      totalCount,
      fraudCount,
      totalVolume,
      lastLatency,
      activeStep,
      notifications,
      dismissNotification,
      clearAllNotifications,
      resendOtpNotification,
      handleInjectFraud,
      handleInjectNormal,
      handleClearHistory,
      validateOtp,
      abortTransaction,
    }),
    [
      isStreaming,
      speedMs,
      transactions,
      selectedTxn,
      totalCount,
      fraudCount,
      totalVolume,
      lastLatency,
      activeStep,
      notifications,
    ]
  );

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
}

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}

// Export lookup helpers for use in customer-facing views
export { CUSTOMER_ACCOUNTS, DEST_LABELS };
export type CustomerProfile = typeof CUSTOMER_ACCOUNTS[string];
