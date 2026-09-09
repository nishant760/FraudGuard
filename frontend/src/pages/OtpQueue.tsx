import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KineticTitle from '../components/ui/KineticTitle';
import { useStream, CUSTOMER_ACCOUNTS, DEST_LABELS } from '../context/StreamContext';
import {
  KeyRound, ArrowRight, ShieldAlert, CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react';

function resolveDestName(id: string) {
  return DEST_LABELS[id] ?? CUSTOMER_ACCOUNTS[id]?.name ?? id;
}
function resolveOrigName(id: string) {
  return CUSTOMER_ACCOUNTS[id]?.name ?? id;
}

export default function OtpQueue() {
  const { transactions, setSelectedTxn } = useStream();
  const navigate = useNavigate();

  // ── CORRECT FILTER: only show transactions where an OTP was actually issued ──
  // otp_code is only generated for MEDIUM and HIGH risk transactions.
  // AUTO_APPROVED (LOW risk) transactions never get an otp_code — exclude them entirely.
  const otpTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.otp_code !== undefined)   // only 2FA-required txns
      .slice(0, 50);
  }, [transactions]);

  const pendingList = otpTransactions.filter((t) => t.auth_status === 'PENDING_2FA');
  const settledList = otpTransactions.filter((t) => t.auth_status !== 'PENDING_2FA');

  const handleOpenPortal = (txnId: string) => {
    const txn = transactions.find((t) => t.txn_id === txnId);
    if (txn) setSelectedTxn(txn);
    navigate(`/security?txn=${txnId}`);
  };

  const riskColor = (level: string) => {
    if (level === 'HIGH') return { color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)' };
    if (level === 'MEDIUM') return { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' };
    return { color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' };
  };

  const renderRow = (item: typeof otpTransactions[0]) => {
    const isPending = item.auth_status === 'PENDING_2FA';
    // APPROVED_2FA = customer confirmed. ABORTED = customer declined.
    const isApproved = item.auth_status === 'APPROVED_2FA';
    const rc = riskColor(item.risk_level);
    const profile = CUSTOMER_ACCOUNTS[item.nameOrig];
    const initials = profile
      ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : item.nameOrig.slice(0, 2).toUpperCase();
    const avatarBg = profile?.card_network === 'Amex'
      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
      : profile?.card_network === 'Mastercard'
        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
        : 'linear-gradient(135deg, #6366f1, #4338ca)';

    return (
      <tr
        key={item.txn_id}
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          opacity: isPending ? 1 : 0.6,
          background: isPending ? 'rgba(245,158,11,.025)' : 'transparent',
          verticalAlign: 'top',
        }}
      >
        {/* Customer */}
        <td style={{ padding: '13px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {resolveOrigName(item.nameOrig)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {item.nameOrig}
              </div>
            </div>
          </div>
        </td>

        {/* Recipient */}
        <td style={{ padding: '13px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {resolveDestName(item.nameDest)}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            {item.nameDest}
          </div>
        </td>

        {/* Amount + Type */}
        <td style={{ padding: '13px 14px' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{item.type}</div>
        </td>

        {/* Risk */}
        <td style={{ padding: '13px 14px' }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11, padding: '3px 9px', borderRadius: 4, fontWeight: 800,
            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
            marginBottom: 4,
          }}>
            {item.risk_level} · {item.risk_score}%
          </span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {item.card_network ?? profile?.card_network} {(item.card_type ?? profile?.card_type) === 'credit' ? 'Credit' : 'Debit'}
          </div>
        </td>

        {/* 🔑 SHAP / Fraud Signal Drivers — prominent display */}
        <td style={{ padding: '13px 14px', maxWidth: 260 }}>
          {item.shap_drivers && item.shap_drivers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {item.shap_drivers.map((driver, i) => {
                const isRisk = driver.includes('+');
                return (
                  <div key={i} style={{
                    display: 'inline-flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '4px 9px',
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: isRisk ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)',
                    color: isRisk ? '#ef4444' : '#10b981',
                    border: `1px solid ${isRisk ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'}`,
                    lineHeight: 1.35,
                  }}>
                    <Zap size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{driver}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No signals</span>
          )}
        </td>

        {/* Time */}
        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {item.timestamp}
        </td>

        {/* Status */}
        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
          {isPending ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 9px', borderRadius: 4, fontWeight: 700, background: 'rgba(245,158,11,.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)' }}>
              <Clock size={11} /> Awaiting OTP
            </span>
          ) : isApproved ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 9px', borderRadius: 4, fontWeight: 700, background: 'rgba(16,185,129,.15)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)' }}>
              <CheckCircle2 size={11} /> Authorized
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 9px', borderRadius: 4, fontWeight: 700, background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)' }}>
              <XCircle size={11} /> Declined
            </span>
          )}
        </td>

        {/* Action */}
        <td style={{ padding: '13px 14px', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => handleOpenPortal(item.txn_id)}
            className="btn btn-primary btn-sm"
            style={{
              fontSize: 11,
              padding: '5px 12px',
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: isPending ? '#6366f1' : 'var(--bg-base)',
              borderColor: isPending ? '#6366f1' : 'var(--border-base)',
              color: isPending ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Open Portal <ArrowRight size={12} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="page-content">
      <KineticTitle
        title="OTP Verification Queue"
        subtitle="Only MEDIUM and HIGH risk transactions appear here — LOW risk transactions are auto-approved instantly and never require OTP."
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>{pendingList.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Awaiting Customer OTP</div>
          </div>
        </div>
        <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
              {settledList.filter((t) => t.auth_status === 'APPROVED_2FA').length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Customer Authorized</div>
          </div>
        </div>
        <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>
              {settledList.filter((t) => t.auth_status === 'ABORTED').length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Customer Declined</div>
          </div>
        </div>
      </div>

      {/* Main table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={18} color="#f59e0b" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            2FA Verification Queue
          </span>
          <span style={{ marginLeft: 4, fontSize: 11.5, color: 'var(--text-muted)' }}>
            — Only MEDIUM &amp; HIGH risk transactions · LOW risk = AUTO_APPROVED (not shown)
          </span>
          {pendingList.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 9px', borderRadius: 10, background: 'rgba(245,158,11,.2)', color: '#f59e0b', fontWeight: 700 }}>
              {pendingList.length} require action
            </span>
          )}
        </div>

        {otpTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <KeyRound size={40} style={{ margin: '0 auto 14px', opacity: .5 }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No 2FA Events Yet</div>
            <div style={{ fontSize: 13 }}>Only MEDIUM and HIGH risk transactions will appear here. LOW risk transactions are auto-approved and never require OTP.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-base)', background: 'var(--bg-subtle)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.055em', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Recipient</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Risk</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>
                    ⚡ Fraud Signals (SHAP Drivers)
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Time</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>Portal</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map(renderRow)}
                {pendingList.length > 0 && settledList.length > 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '6px 14px', background: 'var(--bg-subtle)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', borderTop: '1px solid var(--border-base)', borderBottom: '1px solid var(--border-base)' }}>
                      Settled
                    </td>
                  </tr>
                )}
                {settledList.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
