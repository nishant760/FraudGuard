import { useState } from 'react';
import { useStream } from '../../context/StreamContext';
import { Smartphone, Copy, Check, X, ShieldAlert } from 'lucide-react';

export default function OtpNotificationToast() {
  const { notifications, dismissNotification, clearAllNotifications } = useStream();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!notifications || notifications.length === 0) return null;

  const handleCopy = (id: string, code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 24,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 380,
        maxWidth: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Stack Header Bar if multiple alerts */}
      {notifications.length > 1 && (
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: 11,
            fontWeight: 700,
            color: '#f8fafc',
            animation: 'toastSlideIn 0.25s ease',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            <span>{notifications.length} Active 2FA Alerts Stacked</span>
          </span>
          <button
            type="button"
            onClick={clearAllNotifications}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Dismiss All
          </button>
        </div>
      )}

      {/* Notification Stack Cards */}
      {notifications.map((notif, index) => {
        const isCopied = copiedId === notif.id;
        const isHigh = notif.riskLevel === 'HIGH';

        return (
          <div
            key={notif.id}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 14,
              border: isHigh ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: isHigh
                ? '0 16px 36px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2)'
                : '0 16px 36px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2)',
              color: '#ffffff',
              padding: '14px 16px',
              animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: isHigh ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                    border: isHigh ? '1px solid #ef4444' : '1px solid #6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isHigh ? <ShieldAlert size={13} color="#ef4444" /> : <Smartphone size={13} color="#818cf8" />}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: '#f8fafc' }}>
                    {isHigh ? 'CRITICAL SECURITY ALERT' : 'SMS 2FA NOTIFICATION'}
                  </div>
                  <div style={{ fontSize: 9.5, color: '#94a3b8' }}>
                    {notif.timestamp} · Alert #{index + 1}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissNotification(notif.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            {/* Message Body */}
            <div style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4, marginBottom: 10 }}>
              A <strong style={{ color: '#ffffff' }}>{notif.type}</strong> of <strong style={{ color: isHigh ? '#f87171' : '#fbbf24' }}>${notif.amount.toFixed(2)}</strong> on <span style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{notif.account}</span>.
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Txn ID: {notif.txnId}</div>
            </div>

            {/* OTP Display & Copy Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 10px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
                  OTP Code
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: '0.22em',
                    color: '#38bdf8',
                  }}
                >
                  {notif.otpCode}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(notif.id, notif.otpCode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: isCopied ? '#10b981' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isCopied ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(79, 70, 229, 0.4)',
                }}
              >
                {isCopied ? (
                  <>
                    <Check size={13} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy OTP
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
