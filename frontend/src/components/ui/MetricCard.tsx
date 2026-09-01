import type { ReactNode } from 'react';

interface Props {
  value: string | number;
  label: string;
  icon: ReactNode;
  iconBg?: string;
  valueColor?: string;
  suffix?: string;
}

export default function MetricCard({ value, label, icon, iconBg = '#eef2ff', valueColor = 'var(--text-primary)', suffix }: Props) {
  return (
    <div className="metric-card">
      <div className="metric-card-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="metric-card-value" style={{ color: valueColor }}>
        {value}{suffix && <span style={{ fontSize: '0.55em', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 2 }}>{suffix}</span>}
      </div>
      <div className="metric-card-label">{label}</div>
    </div>
  );
}
