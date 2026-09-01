import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

export default function TopBar() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Shield size={14} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Fraud Detection Dashboard</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-timestamp">{time}</span>
      </div>
    </header>
  );
}
