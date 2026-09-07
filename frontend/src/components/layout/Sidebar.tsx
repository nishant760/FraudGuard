import { useEffect, useState } from 'react';
import { checkHealth } from '../../api/fraud';
import { ShieldCheck, Cpu } from 'lucide-react';
import MenuAnimation, { type MenuItemObject } from '../ui/MenuAnimation';
// import AvatarList from '../ui/AvatarList';

type HealthStatus = 'checking' | 'online' | 'offline';

const NAV_ITEMS: MenuItemObject[] = [
  { label: 'Transaction Assessment', path: '/', end: true },
  { label: 'Analytics & Models', path: '/analytics' },
  { label: 'Transaction History', path: '/transactions' },
];

export default function Sidebar() {
  const [health, setHealth] = useState<HealthStatus>('checking');

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

        <div className="sidebar-section-label" style={{ marginTop: 24 }}>ML Pipeline Info</div>
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={16} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>XGBoost Model</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>IEEE-CIS Dataset</div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="health-indicator">
          <div className={`health-dot ${health}`} />
          <span>{healthLabel}</span>
        </div>
      </div>
    </aside>
  );
}
