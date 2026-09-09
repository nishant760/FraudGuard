import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import KineticTitle from '../components/ui/KineticTitle';
import GlowingCard from '../components/ui/GlowingCard';
import { useStream, CUSTOMER_ACCOUNTS, DEST_LABELS } from '../context/StreamContext';
import type { StreamTransaction } from '../types';
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Search,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  XCircle,
  CreditCard,
  User,
  ArrowLeft,
} from 'lucide-react';

function resolveDestName(id: string) {
  return DEST_LABELS[id] ?? CUSTOMER_ACCOUNTS[id]?.name ?? id;
}

export default function SecurityCenter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const focusTxnId = searchParams.get('txn');

  const { transactions, setSelectedTxn, validateOtp, abortTransaction } = useStream();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChallengeTxnId, setActiveChallengeTxnId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<boolean | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // ── Determine the "focus" transaction from URL param ──────────────────────
  const focusTxn: StreamTransaction | null = useMemo(() => {
    if (!focusTxnId) return null;
    return transactions.find((t) => t.txn_id === focusTxnId) ?? null;
  }, [focusTxnId, transactions]);

  // The customer we're viewing — derived from the focused transaction's nameOrig
  const customerId = focusTxn?.nameOrig ?? null;
  const customerProfile = customerId ? CUSTOMER_ACCOUNTS[customerId] : null;

  // Sync active challenge when URL param changes
  useEffect(() => {
    if (focusTxnId) setActiveChallengeTxnId(focusTxnId);
  }, [focusTxnId]);

  // ── Only show THIS customer's transactions ────────────────────────────────
  const myTransactions = useMemo(() => {
    if (!customerId) return [];
    return transactions.filter((t) => t.nameOrig === customerId);
  }, [transactions, customerId]);

  const pendingChallenges = useMemo(() => {
    return myTransactions.filter((t) => t.auth_status === 'PENDING_2FA');
  }, [myTransactions]);

  // Auto-select first pending when active challenge resolves
  useEffect(() => {
    if (!activeChallengeTxnId && pendingChallenges.length > 0) {
      setActiveChallengeTxnId(pendingChallenges[0].txn_id);
    }
  }, [pendingChallenges, activeChallengeTxnId]);

  const activeChallengeTxn: StreamTransaction | undefined = useMemo(() => {
    if (activeChallengeTxnId) return myTransactions.find((t) => t.txn_id === activeChallengeTxnId);
    return pendingChallenges[0] ?? myTransactions[0];
  }, [activeChallengeTxnId, myTransactions, pendingChallenges]);

  // Search filter
  const filteredHistory = useMemo(() => {
    const base = myTransactions.slice(0, 20);
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (t) =>
        t.txn_id.toLowerCase().includes(q) ||
        resolveDestName(t.nameDest).toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );
  }, [myTransactions, searchQuery]);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAutoPasteOtp = (code: string) => {
    setOtpInput(code);
    setAuthMessage(null);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChallengeTxn) return;
    if (!otpInput.trim()) {
      setAuthSuccess(false);
      setAuthMessage('Please enter the 6-digit OTP from the SMS message.');
      return;
    }
    const success = validateOtp(activeChallengeTxn.txn_id, otpInput.trim());
    if (success) {
      setAuthSuccess(true);
      setAuthMessage(
        `✅ Payment of $${activeChallengeTxn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${resolveDestName(activeChallengeTxn.nameDest)} authorized & completed.`
      );
      setOtpInput('');
      setTimeout(() => { setAuthSuccess(null); setAuthMessage(null); }, 5500);
    } else {
      setAuthSuccess(false);
      setAuthMessage('❌ Incorrect passcode. Please check the SMS code and try again.');
    }
  };

  const handleDeclineTxn = () => {
    if (!activeChallengeTxn) return;
    abortTransaction(activeChallengeTxn.txn_id);
    setAuthSuccess(false);
    setAuthMessage(`⛔ Transfer of $${activeChallengeTxn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} was declined by you.`);
    setOtpInput('');
    setTimeout(() => { setAuthSuccess(null); setAuthMessage(null); }, 5500);
  };

  // ── No customer selected — show placeholder ───────────────────────────────
  if (!customerId || !customerProfile) {
    return (
      <div className="page-content">
        <KineticTitle
          title="Customer Portal"
          subtitle="Select a transaction from the OTP Verification Queue to view a customer's secure banking portal."
        />
        <div className="card" style={{ padding: '70px 30px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <User size={28} color="#6366f1" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>No Customer Selected</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Go to the <strong>OTP Verification Queue</strong> and click <strong>"Open Portal"</strong> next to any transaction to view that customer's account, pending authorization, and transaction history.
          </div>
          <button
            type="button"
            onClick={() => navigate('/otp-queue')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <KeyRound size={16} /> Go to OTP Queue
          </button>
        </div>
      </div>
    );
  }

  // card_type for the active txn may differ from profile default (e.g. auto-upgraded to credit if amount > balance)
  const activeTxnCardType = activeChallengeTxn?.card_type ?? customerProfile.card_type;
  const activeTxnCardNetwork = activeChallengeTxn?.card_network ?? customerProfile.card_network;
  const cardLabel = `${activeTxnCardNetwork} ${activeTxnCardType === 'debit' ? 'Debit' : 'Credit'} (•••• ${customerId.slice(-4)})`;
  const pendingCount = pendingChallenges.length;
  const initials = customerProfile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarGradient = activeTxnCardNetwork === 'Amex'
    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
    : activeTxnCardNetwork === 'Mastercard'
      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
      : 'linear-gradient(135deg, #6366f1, #4338ca)';


  return (
    <div className="page-content">
      {/* Back to queue */}
      <button
        type="button"
        onClick={() => navigate('/otp-queue')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 16, padding: '4px 0' }}
      >
        <ArrowLeft size={14} /> Back to OTP Queue
      </button>

      <KineticTitle
        title={`${customerProfile.name}'s Portal`}
        subtitle={`Account ${customerId} · ${customerProfile.card_network} ${customerProfile.card_type === 'credit' ? 'Credit' : 'Debit'} · Secure 2FA verification view`}
      />

      {/* ── 1. ACCOUNT BANNER ──────────────────────────────────────────────── */}
      <GlowingCard fromColor="#6366f1" viaColor="#818cf8" toColor="#4f46e5" className="mb-6">
        <div style={{ padding: '22px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, boxShadow: '0 4px 14px rgba(99,102,241,.4)', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>{customerProfile.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,.15)', color: '#10b981', fontWeight: 700, border: '1px solid rgba(16,185,129,.3)' }}>Active</span>
                  {pendingCount > 0 && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 700, border: '1px solid rgba(245,158,11,.3)' }}>
                      {pendingCount} OTP Pending
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span>Account: <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{customerId}</strong></span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CreditCard size={13} />
                    <strong style={{ color: 'var(--text-primary)' }}>{cardLabel}</strong>
                  </span>
                  <span>•</span>
                  <span>2FA: <strong style={{ color: 'var(--text-primary)' }}>+1 (555) 019-{customerId.slice(-4)}</strong></span>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Available Balance</div>
              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#10b981', marginTop: 3 }}>
                ${customerProfile.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </GlowingCard>

      {/* ── 2. PAYMENT AUTH + 3. SMS OTP SIMULATOR ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 24, marginBottom: 28 }}>

        {/* Left: Payment Authorization */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={20} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Payment Authorization</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Verify with the SMS code sent to the registered mobile</div>
              </div>
            </div>
            {activeChallengeTxn && (() => {
              const s = activeChallengeTxn.auth_status;
              const label = s === 'APPROVED_2FA' ? 'Completed' : s === 'ABORTED' ? 'Declined' : 'Requires Verification';
              const color = s === 'APPROVED_2FA' ? '#10b981' : s === 'ABORTED' ? '#ef4444' : '#f59e0b';
              const bg = s === 'APPROVED_2FA' ? 'rgba(16,185,129,.15)' : s === 'ABORTED' ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)';
              const bdr = s === 'APPROVED_2FA' ? 'rgba(16,185,129,.3)' : s === 'ABORTED' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)';
              return <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 700, background: bg, color, border: `1px solid ${bdr}` }}>{label}</span>;
            })()}
          </div>

          {activeChallengeTxn ? (
            <div>
              {/* Transaction Summary */}
              <div style={{ padding: 18, borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Transfer Amount</span>
                    <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: '#6366f1' }}>
                      ${activeChallengeTxn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Reference ID</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>{activeChallengeTxn.txn_id}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>From (You)</span>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{customerProfile.name}</strong>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{customerId}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>To (Recipient)</span>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{resolveDestName(activeChallengeTxn.nameDest)}</strong>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{activeChallengeTxn.nameDest}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Payment Method</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{cardLabel}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Type & Time</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{activeChallengeTxn.type}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{activeChallengeTxn.timestamp}</span>
                  </div>
                </div>
              </div>

              {authMessage && (
                <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: authSuccess ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: authSuccess ? '#10b981' : '#ef4444', border: `1px solid ${authSuccess ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {authSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{authMessage}</span>
                </div>
              )}

              {activeChallengeTxn.auth_status === 'PENDING_2FA' ? (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Enter SMS Verification Code:</label>
                      {activeChallengeTxn.otp_code && (
                        <button type="button" onClick={() => handleAutoPasteOtp(activeChallengeTxn.otp_code!)} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={13} /> Auto-Fill ({activeChallengeTxn.otp_code})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="_ _ _ _ _ _"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="form-control"
                      style={{ height: 50, fontSize: 24, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '.45em', textAlign: 'center', borderRadius: 8, borderColor: otpInput.length === 6 ? '#10b981' : 'var(--border-base)' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                    <button type="submit" className="btn btn-primary" style={{ height: 44, fontSize: 14, fontWeight: 700, background: '#10b981', borderColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(16,185,129,.3)' }}>
                      <ShieldCheck size={18} /> Authorize Payment
                    </button>
                    <button type="button" onClick={handleDeclineTxn} className="btn btn-outline" style={{ height: 44, fontSize: 13, fontWeight: 700, color: '#ef4444', borderColor: 'rgba(239,68,68,.4)', background: 'rgba(239,68,68,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <XCircle size={16} /> Decline
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: 18, borderRadius: 8, textAlign: 'center', background: activeChallengeTxn.auth_status === 'APPROVED_2FA' ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${activeChallengeTxn.auth_status === 'APPROVED_2FA' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: activeChallengeTxn.auth_status === 'APPROVED_2FA' ? '#10b981' : '#ef4444', marginBottom: 4 }}>
                    {activeChallengeTxn.auth_status === 'APPROVED_2FA' ? 'Payment Authorized & Completed' : 'Transaction Declined by Customer'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {activeChallengeTxn.auth_status === 'APPROVED_2FA' ? 'Funds have been successfully transferred to the recipient.' : 'This payment was cancelled and no funds were deducted.'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={40} color="#10b981" style={{ margin: '0 auto 12px', opacity: .8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Pending Authorizations</div>
              <div style={{ fontSize: 13, maxWidth: 300, margin: '0 auto' }}>This customer has no transactions requiring verification at this time.</div>
            </div>
          )}
        </div>

        {/* Right: SMS OTP Simulator */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color="#38bdf8" />
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>SMS Security Alert</span>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(56,189,248,.12)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(56,189,248,.25)' }}>
                6-Digit OTP
              </span>
            </div>

            {/* Phone mockup */}
            <div style={{ borderRadius: 14, background: 'rgba(15,23,42,.95)', border: '1px solid rgba(56,189,248,.3)', padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,.35)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={13} color="#fff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>FRAUDGUARD BANK</span>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>just now</span>
              </div>

              {activeChallengeTxn?.otp_code ? (
                <div>
                  <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                    Your transfer of{' '}
                    <strong style={{ color: '#38bdf8' }}>${activeChallengeTxn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>{' '}
                    to <strong style={{ color: '#f8fafc' }}>{resolveDestName(activeChallengeTxn.nameDest)}</strong> requires verification. Do not share this code with anyone.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,.4)', padding: '10px 14px', borderRadius: 8, border: '1px dashed rgba(56,189,248,.4)' }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>One-Time Passcode</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 900, letterSpacing: '.25em', color: '#38bdf8' }}>{activeChallengeTxn.otp_code}</span>
                    </div>
                    <button type="button" onClick={() => handleCopy(activeChallengeTxn.txn_id, activeChallengeTxn.otp_code!)} style={{ background: copiedId === activeChallengeTxn.txn_id ? '#10b981' : '#6366f1', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {copiedId === activeChallengeTxn.txn_id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === activeChallengeTxn.txn_id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '10px 0 0', lineHeight: 1.4 }}>
                    Expires in 5 min · Sent to +1 (555) 019-{customerId.slice(-4)}
                  </p>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
                  No pending OTP alerts. Device is active and monitoring.
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              📱 OTP Type: <strong>SMS 6-Digit Passcode</strong> · {customerProfile.card_network} {customerProfile.card_type === 'debit' ? 'Debit' : 'Credit'} · +1 (555) 019-{customerId.slice(-4)}
            </div>
          </div>

          {/* Quick select other pending txns for this customer */}
          {pendingChallenges.length > 1 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Other Pending Verifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendingChallenges.filter((t) => t.txn_id !== activeChallengeTxnId).slice(0, 3).map((t) => (
                  <button key={t.txn_id} type="button" onClick={() => { setActiveChallengeTxnId(t.txn_id); if (t.otp_code) handleAutoPasteOtp(t.otp_code); }} className="btn btn-outline btn-sm" style={{ fontSize: 11, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace' }}>{t.txn_id}</span>
                    <span style={{ fontWeight: 800 }}>${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. THIS CUSTOMER'S TRANSACTION STATEMENT ─────────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Transaction Statement</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing transactions from account &nbsp;<strong style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{customerId}</strong>
            </div>
          </div>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search recipient, type, amount…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-control" style={{ paddingLeft: 34, fontSize: 12, height: 36 }} />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No transactions from this customer yet.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Transactions will appear here as the stream routes them through this account.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)', color: 'var(--text-muted)', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  <th style={{ padding: '10px 12px' }}>Ref ID</th>
                  <th style={{ padding: '10px 12px' }}>Recipient</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Card Used</th>
                  <th style={{ padding: '10px 12px' }}>Balance Before</th>
                  <th style={{ padding: '10px 12px' }}>Balance After</th>
                  <th style={{ padding: '10px 12px' }}>Time</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const isSelected = activeChallengeTxn?.txn_id === item.txn_id;
                  const isPending = item.auth_status === 'PENDING_2FA';
                  const isApproved = item.auth_status === 'APPROVED_2FA' || item.auth_status === 'AUTO_APPROVED';
                  const isAborted = item.auth_status === 'ABORTED';
                  const cardInfo = `${item.card_network ?? customerProfile.card_network} ${item.card_type === 'credit' ? 'Credit' : 'Debit'}`;

                  return (
                    <tr key={item.txn_id} style={{ borderBottom: '1px solid var(--border-subtle)', background: isSelected ? 'rgba(99,102,241,.05)' : 'transparent', transition: 'background .15s' }}>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{item.txn_id}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{resolveDestName(item.nameDest)}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 600 }}>{item.type}</span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{cardInfo}</td>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                        ${item.oldbalanceOrg.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: 12, color: item.newbalanceOrig < item.oldbalanceOrg ? '#f59e0b' : '#10b981' }}>
                        ${item.newbalanceOrig.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{item.timestamp}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        -${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                        {isApproved ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(16,185,129,.15)', color: '#10b981', fontWeight: 700 }}>Completed</span>
                        ) : isAborted ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(239,68,68,.15)', color: '#ef4444', fontWeight: 700 }}>Declined</span>
                        ) : (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 700 }}>Pending OTP</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                        {isPending ? (
                          <button type="button" onClick={() => { setActiveChallengeTxnId(item.txn_id); setSelectedTxn(item); if (item.otp_code) handleAutoPasteOtp(item.otp_code); }} className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px', height: 28 }}>
                            Verify OTP
                          </button>
                        ) : (
                          <button type="button" onClick={() => { setActiveChallengeTxnId(item.txn_id); setSelectedTxn(item); }} className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '4px 10px', height: 28 }}>
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
