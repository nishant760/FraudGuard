import type { RiskLevel } from '../../types';

interface Props {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export default function RiskBadge({ level, size = 'md' }: Props) {
  return (
    <span className={`risk-badge ${level}`} style={size === 'sm' ? { fontSize: 10, padding: '2px 8px' } : {}}>
      <span className="risk-badge-dot" />
      {level}
    </span>
  );
}
