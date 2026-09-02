import type { ReactNode } from 'react';
import GlowingCard from './GlowingCard';

interface Props {
  value: string | number;
  label: string;
  icon: ReactNode;
  iconBg?: string;
  valueColor?: string;
  suffix?: string;
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
}

export default function MetricCard({
  value,
  label,
  icon,
  iconBg = '#eef2ff',
  valueColor = 'var(--text-primary)',
  suffix,
  fromColor = 'rgba(99, 102, 241, 0.35)',
  viaColor = 'rgba(168, 85, 247, 0.25)',
  toColor = 'rgba(59, 130, 246, 0.35)',
}: Props) {
  return (
    <GlowingCard
      fromColor={fromColor}
      viaColor={viaColor}
      toColor={toColor}
      borderRadius="var(--radius-lg)"
    >
      <div className="metric-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
        <div className="metric-card-icon" style={{ background: iconBg }}>
          {icon}
        </div>
        <div className="metric-card-value" style={{ color: valueColor }}>
          {value}
          {suffix && (
            <span style={{ fontSize: '0.55em', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 2 }}>
              {suffix}
            </span>
          )}
        </div>
        <div className="metric-card-label">{label}</div>
      </div>
    </GlowingCard>
  );
}
