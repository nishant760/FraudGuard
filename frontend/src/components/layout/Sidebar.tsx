import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { checkHealth } from '../../api/fraud';
import { ShieldCheck, Cpu, Smartphone, KeyRound, ListChecks } from 'lucide-react';
import MenuAnimation, { type MenuItemObject } from '../ui/MenuAnimation';
import { useStream } from '../../context/StreamContext';

type HealthStatus = 'checking' | 'online' | 'offline';

const NAV_ITEMS: MenuItemObject[] = [
  { label: 'Real-Time Stream (Kafka)', path: '/', end: true },
  { label: 'Manual Assessment', path: '/assessment' },
  { label: 'Analytics & Models', path: '/analytics' },
  { label: 'Transaction History', path: '/transactions' },
];

export default function Sidebar() {
  const [health, setHealth] = useState<HealthStatus>('checking');
  const { transactions } = useStream();

  // Count pending OTPs for badge
  const pendingOtpCount = transactions.filter((t) => t.auth_status === 'PENDING_2FA').length;

  useEffect(() => {
    const ping = () => {
      checkHealth()
        .then(() => setHealth('online'))
        .catch(() => setHealth('offline'));
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthLabel =
    health === 'checking' ? 'Connecting...' :
    health === 'online'   ? 'Backend Online' :
                            'Backend Offline';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={18} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-text">FraudGuard AI</div>
          <div className="sidebar-logo-sub">Risk Intelligence Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Modules</div>

        <MenuAnimation menuItems={NAV_ITEMS} />

        {/* OTP Verification Queue — admin view */}
        <NavLink
          to="/otp-queue"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: isActive ? '1px solid rgba(245,158,11,.5)' : '1px solid transparent',
            color: isActive ? '#f59e0b' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s ease',
            marginTop: 4,
            position: 'relative',
          })}
        >
          <ListChecks size={16} />
          <span style={{ flex: 1 }}>OTP Verification Queue</span>
          {pendingOtpCount > 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 8,
              background: '#f59e0b',
              color: '#fff',
              minWidth: 18,
              textAlign: 'center',
            }}>
              {pendingOtpCount}
            </span>
          )}
        </NavLink>

        <div className="sidebar-section-label" style={{ marginTop: 20 }}>ML Pipeline Info</div>
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={16} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>XGBoost Model</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IEEE-CIS Dataset</div>
          </div>
        </div>
      </nav>

      {/* Footer: Customer Portal entry + Backend health */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Customer Portal — navigates to /security (empty state unless OTP Queue sets txn) */}
        <NavLink
          to="/security"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
            border: isActive ? '1px solid #6366f1' : '1px solid var(--border-base)',
            color: isActive ? '#818cf8' : 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s ease',
          })}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: 11, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
          }}>
            <KeyRound size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Customer Portal
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              2FA &amp; Account View
            </div>
          </div>
          <Smartphone size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </NavLink>

        <div className="health-indicator" style={{ paddingTop: 2 }}>
          <div className={`health-dot ${health}`} />
          <span>{healthLabel}</span>
        </div>
      </div>
    </aside>
  );
}
