import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { checkHealth } from '../../api/fraud';
import { ShieldCheck, Cpu, Smartphone, ListChecks } from 'lucide-react';
import MenuAnimation, { type MenuItemObject } from '../ui/MenuAnimation';
import { useStream } from '../../context/StreamContext';
import { useAuth } from '../../context/AuthContext';

type HealthStatus = 'checking' | 'online' | 'offline';

// ── Navigation items per role ─────────────────────────────────────────────────
const ORG_NAV_ITEMS: MenuItemObject[] = [
  { label: 'Real-Time Stream (Kafka)', path: '/', end: true },
  { label: 'Analytics & Models',        path: '/analytics' },
  { label: 'Transaction History',       path: '/transactions' },
];

const CONSUMER_NAV_ITEMS: MenuItemObject[] = [
  { label: 'Payment Risk Scanner',     path: '/assessment' },
  { label: 'My Transaction Activity',  path: '/transactions' },
];

export default function Sidebar() {
  const [health, setHealth] = useState<HealthStatus>('checking');
  const { transactions } = useStream();
  const { user } = useAuth();

  const isOrg = user?.role === 'ORGANISATION';

  // Count pending OTPs for the badge (only relevant for org view)
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
        <div className="sidebar-section-label">
          {isOrg ? 'Operations' : 'My Account'}
        </div>

        {/* Role-filtered main nav */}
        <MenuAnimation menuItems={isOrg ? ORG_NAV_ITEMS : CONSUMER_NAV_ITEMS} />

        {/* OTP Verification Queue — Organisation only */}
        {isOrg && (
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
        )}

        {/* Consumer-only: My Card & 2FA Security link */}
        {!isOrg && (
          <NavLink
            to="/security"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,.5)' : '1px solid transparent',
              color: isActive ? '#818cf8' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s ease',
              marginTop: 4,
            })}
          >
            <Smartphone size={16} />
            <span style={{ flex: 1 }}>My Card &amp; 2FA Security</span>
          </NavLink>
        )}

        {/* ML Pipeline info */}
        <div className="sidebar-section-label" style={{ marginTop: 20 }}>ML Pipeline Info</div>
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={16} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>XGBoost Model</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IEEE-CIS Dataset</div>
          </div>
        </div>
      </nav>

      {/* Footer: backend health indicator only */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Backend health indicator */}
        <div className="health-indicator" style={{ paddingTop: 2 }}>
          <div className={`health-dot ${health}`} />
          <span>{healthLabel}</span>
        </div>
      </div>
    </aside>
  );
}
