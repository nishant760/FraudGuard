import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlowingCard from '../components/ui/GlowingCard';
import MetricCard from '../components/ui/MetricCard';
import KineticTitle from '../components/ui/KineticTitle';
import RiskBadge from '../components/ui/RiskBadge';
import { useStream } from '../context/StreamContext';
import {
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Trash2,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  XCircle,
  Lock,
} from 'lucide-react';

export default function KafkaStream() {
  const navigate = useNavigate();
  const {
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
    handleInjectFraud,
    handleInjectNormal,
    handleClearHistory,
    validateOtp,
    abortTransaction,
  } = useStream();

  const [otpInput, setOtpInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setOtpInput('');
    setValidationError(null);
  }, [selectedTxn?.txn_id]);

  const handleValidate = () => {
    if (!selectedTxn) return;
    if (!otpInput.trim()) {
      setValidationError('Please enter the 6-digit OTP code.');
      return;
    }
    const success = validateOtp(selectedTxn.txn_id, otpInput.trim());
    if (success) {
      setValidationError(null);
    } else {
      setValidationError('❌ Invalid OTP! Passcode does not match the security alert code. Transaction cannot proceed.');
    }
  };

  const handleAbort = () => {
    if (!selectedTxn) return;
    abortTransaction(selectedTxn.txn_id);
    setValidationError(null);
  };

  const fraudRatePct = totalCount > 0 ? ((fraudCount / totalCount) * 100).toFixed(1) : '0.0';

  // Filter pending review transactions
  const flaggedList = transactions.filter(
    (t) => t.risk_level === 'MEDIUM' || t.risk_level === 'HIGH'
  );

  return (
    <div className="page-content">
      {/* Title */}
      <KineticTitle
        title="Real-Time Streaming Engine"
        subtitle="Kafka transaction event stream with 24-step sliding-window velocity tracking and live XGBoost scoring."
      />

      {/* Control Strip */}
      <GlowingCard className="mb-6">
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            {/* Left: Stream Status & Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: isStreaming ? '#10b981' : '#f59e0b',
                    boxShadow: isStreaming ? '0 0 10px #10b981' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {isStreaming ? 'Kafka Stream LIVE' : 'Kafka Stream PAUSED'}
                </span>
              </div>

              <div style={{ height: 20, width: 1, backgroundColor: 'var(--border-base)' }} />

              <button
                type="button"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`btn ${isStreaming ? 'btn-secondary' : 'btn-primary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}
              >
                {isStreaming ? (
                  <>
                    <Pause size={13} /> Pause Stream
                  </>
                ) : (
                  <>
                    <Play size={13} /> Resume Stream
                  </>
                )}
              </button>
            </div>

            {/* Right: Simulation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleInjectFraud}
                className="btn btn-secondary"
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <Zap size={14} color="#ef4444" /> Inject Fraud Burst
              </button>

              <button
                type="button"
                onClick={handleInjectNormal}
                className="btn btn-secondary"
                style={{
                  color: '#10b981',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <CheckCircle2 size={14} color="#10b981" /> Send Normal Txn
              </button>

              {/* Speed dropdown */}
              <select
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="form-control"
                style={{ width: 'auto', fontSize: 12, padding: '6px 12px' }}
              >
                <option value={2500}>Speed: 2.5s</option>
                <option value={1500}>Speed: 1.5s</option>
                <option value={750}>Speed: 0.75s (Fast)</option>
                <option value={300}>Speed: 0.3s (Turbo)</option>
              </select>

              <button
                type="button"
                onClick={handleClearHistory}
                className="btn btn-secondary"
                title="Clear feed"
                style={{ padding: '8px 10px', color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </GlowingCard>

      {/* 4 Live Telemetry Metrics */}
      <div className="metric-cards-grid">
        <MetricCard
          label="Total Streamed"
          value={totalCount.toLocaleString()}
          icon={<Activity size={18} color="#6366f1" />}
          iconBg="rgba(99, 102, 241, 0.12)"
          suffix="events"
          fromColor="rgba(99, 102, 241, 0.35)"
        />
        <MetricCard
          label="Fraud Detected"
          value={fraudCount.toLocaleString()}
          icon={<AlertTriangle size={18} color="#ef4444" />}
          iconBg="rgba(239, 68, 68, 0.12)"
          suffix={`(${fraudRatePct}%)`}
          valueColor="#ef4444"
          fromColor="rgba(239, 68, 68, 0.35)"
        />
        <MetricCard
          label="Total Volume"
          value={`$${Math.round(totalVolume).toLocaleString()}`}
          icon={<DollarSign size={18} color="#10b981" />}
          iconBg="rgba(16, 185, 129, 0.12)"
          fromColor="rgba(16, 185, 129, 0.35)"
        />
        <MetricCard
          label="Engine Latency"
          value={`${lastLatency.toFixed(1)}`}
          icon={<Clock size={18} color="#f59e0b" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          suffix="ms / event"
          fromColor="rgba(245, 158, 11, 0.35)"
        />
      </div>

      {/* Main Streaming Feed + 2FA & Security Action Center */}
      <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
        {/* Left: Live Event Feed */}
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">Live Kafka Event Stream</div>
                <div className="card-subtitle">
                  Incoming real-time transaction payloads scored via XGBoost
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Showing last {transactions.length} events
              </span>
            </div>

            {/* Scrollable feed list */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 520,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <div>Waiting for streaming events...</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Start the stream or click "Inject Fraud Burst"
                  </div>
                </div>
              ) : (
                transactions.map((txn) => {
                  const isSelected = selectedTxn?.txn_id === txn.txn_id;
                  const isFraud = txn.is_fraud_predicted === 1;

                  return (
                    <div
                      key={txn.txn_id}
                      onClick={() => setSelectedTxn(txn)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '1.5px solid #6366f1'
                          : isFraud
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid var(--border-base)',
                        background: isSelected
                          ? 'rgba(99, 102, 241, 0.06)'
                          : isFraud
                          ? 'rgba(239, 68, 68, 0.04)'
                          : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor:
                              txn.risk_level === 'HIGH'
                                ? '#ef4444'
                                : txn.risk_level === 'MEDIUM'
                                ? '#f59e0b'
                                : '#10b981',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                              {txn.txn_id}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'var(--bg-subtle)',
                                fontWeight: 600,
                              }}
                            >
                              {txn.type}
                            </span>
                            {txn.auth_status === 'APPROVED_2FA' && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                                2FA Passed
                              </span>
                            )}
                            {txn.auth_status === 'ABORTED' && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                                Aborted
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {txn.nameOrig} ➔ {txn.nameDest} · {txn.timestamp}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                          ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <RiskBadge level={txn.risk_level} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: 2FA & Security Clearance Verification Action Center */}
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={16} color="#6366f1" />
                  <span>2FA &amp; Security Clearance Hub</span>
                </div>
                <div className="card-subtitle">
                  Authenticate or abort high and medium risk transactions
                </div>
              </div>
            </div>

            {/* Pending Transactions List */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pending 2FA &amp; Security Queue</span>
                <span style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  {flaggedList.filter(t => t.auth_status === 'PENDING_2FA').length} Awaiting Auth
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 160,
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
              >
                {flaggedList.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                    No pending medium or high risk transactions.
                  </div>
                ) : (
                  flaggedList.slice(0, 10).map((item) => {
                    const isSelected = selectedTxn?.txn_id === item.txn_id;

                    return (
                      <div
                        key={item.txn_id}
                        onClick={() => setSelectedTxn(item)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border-base)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: item.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.txn_id}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {item.type} · ${item.amount.toFixed(0)}
                            </div>
                          </div>
                        </div>

                        <div>
                          {item.auth_status === 'APPROVED_2FA' ? (
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                              Verified
                            </span>
                          ) : item.auth_status === 'ABORTED' ? (
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 700 }}>
                              Aborted
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: item.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: item.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                              {item.risk_level === 'HIGH' ? 'Critical Review' : '2FA Required'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!selectedTxn ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a transaction from the feed or queue to verify.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Transaction Header Overview */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-base)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>
                      {selectedTxn.txn_id}
                    </span>
                    <RiskBadge level={selectedTxn.risk_level} size="md" />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: selectedTxn.risk_level === 'HIGH' ? '#ef4444' : selectedTxn.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981' }}>
                    ${selectedTxn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{selectedTxn.nameOrig}</span>
                    <ArrowRight size={12} />
                    <span>{selectedTxn.nameDest}</span>
                    <span>·</span>
                    <span style={{ fontWeight: 600 }}>{selectedTxn.type}</span>
                  </div>

                  {/* Real-Time SHAP Risk Drivers */}
                  {selectedTxn.shap_drivers && selectedTxn.shap_drivers.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-base)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                        ⚡ Real-Time SHAP Decision Drivers:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedTxn.shap_drivers.map((driver, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: driver.includes('+') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: driver.includes('+') ? '#ef4444' : '#10b981',
                              border: driver.includes('+') ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            {driver}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* 2FA Dispatch Status Card */}
                {selectedTxn.otp_code && selectedTxn.auth_status === 'PENDING_2FA' && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                        <Smartphone size={15} />
                        <span>SECURITY OTP DISPATCHED</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/security')}
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#4f46e5',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🔐 Open 2FA Vault Tab
                      </button>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      A 6-digit verification code was dispatched for account <strong>{selectedTxn.nameOrig}</strong>.
                      <br />You can view, copy, and validate all active passcodes in the <strong>2FA &amp; Security Center</strong> tab.
                    </div>
                  </div>
                )}

                {/* 2FA Verification Form OR Resolution State */}
                {selectedTxn.auth_status === 'APPROVED_2FA' ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1.5px solid #10b981',
                      textAlign: 'center',
                    }}
                  >
                    <ShieldCheck size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                      2FA Validated &amp; Transaction Proceeded
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      The OTP was verified successfully. Funds of ${selectedTxn.amount.toFixed(2)} have been released and settled.
                    </div>
                  </div>
                ) : selectedTxn.auth_status === 'ABORTED' ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1.5px solid #ef4444',
                      textAlign: 'center',
                    }}
                  >
                    <XCircle size={32} color="#ef4444" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
                      Transaction Aborted &amp; Declined
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Transaction was declined by security protocol. Account funds remain frozen and protected.
                    </div>
                  </div>
                ) : selectedTxn.auth_status === 'AUTO_APPROVED' ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <ShieldCheck size={20} color="#10b981" />
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                      Zero-Friction Pass: Low risk score ({selectedTxn.risk_score}/100). Auto-settled.
                    </div>
                  </div>
                ) : (
                  /* Pending 2FA Form */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        Enter 6-Digit OTP to Authenticate:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Paste or type 6-digit OTP"
                        className="form-control"
                        style={{
                          fontSize: 16,
                          fontFamily: 'monospace',
                          letterSpacing: '0.15em',
                          textAlign: 'center',
                          padding: '10px 14px',
                        }}
                      />
                    </div>

                    {validationError && (
                      <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldAlert size={14} /> {validationError}
                      </div>
                    )}

                    {/* Dual Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={handleValidate}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 12,
                          padding: '10px',
                          background: '#10b981',
                          borderColor: '#10b981',
                        }}
                      >
                        <ShieldCheck size={15} /> Validate &amp; Proceed
                      </button>

                      <button
                        type="button"
                        onClick={handleAbort}
                        className="btn btn-secondary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 12,
                          padding: '10px',
                          color: '#ef4444',
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          background: 'rgba(239, 68, 68, 0.06)',
                        }}
                      >
                        <XCircle size={15} /> Abort Transaction
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
