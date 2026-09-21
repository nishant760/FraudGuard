import { useEffect, useState } from 'react';
import { Shield, Building2, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  const { user, logout } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const isOrg = user?.role === 'ORGANISATION';

  return (
    <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Left: breadcrumb */}
      <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Shield size={14} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
          Fraud Detection Dashboard
        </span>
      </div>

      {/* Right: identity pill + timestamp + sign out */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="topbar-timestamp">{time}</span>

        {/* Identity pill */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px 5px 7px',
            borderRadius: 99,
            border: `1px solid ${isOrg ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
            background: isOrg ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
          }}>
            {/* Role icon */}
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: isOrg ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {isOrg
                ? <Building2 size={11} color="white" strokeWidth={2.5} />
                : <User size={11} color="white" strokeWidth={2.5} />}
            </div>

            {/* Email + role label */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, maxWidth: 200, overflow: 'hidden' }}>
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: isOrg ? '#4f46e5' : '#059669',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.displayName}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isOrg ? 'Organisation' : user.email}
              </span>
            </div>
          </div>
        )}

        {/* Sign Out button */}
        {user && (
          <button
            onClick={logout}
            title="Sign Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-base)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-base)';
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
