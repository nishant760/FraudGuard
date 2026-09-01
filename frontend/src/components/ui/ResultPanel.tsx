import type { PredictResponse } from '../../types';
import RiskBadge from './RiskBadge';
import GaugeChart from './GaugeChart';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
  result: PredictResponse;
}

const RISK_PROB_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export default function ResultPanel({ result }: Props) {
  const isLegitimate = result.prediction === 0;
  const probPercent = (result.fraud_probability * 100).toFixed(2);
  const color = RISK_PROB_COLORS[result.risk_level];

  return (
    <div className="result-panel">
      {/* Verdict Banner */}
      <div className={`result-verdict-banner ${isLegitimate ? 'legitimate' : 'fraud'}`}>
        <div className={`verdict-icon ${isLegitimate ? 'legitimate' : 'fraud'}`}>
          {isLegitimate
            ? <ShieldCheck size={22} color="white" strokeWidth={2.5} />
            : <ShieldAlert size={22} color="white" strokeWidth={2.5} />
          }
        </div>
        <div>
          <div className={`verdict-label ${isLegitimate ? 'legitimate' : 'fraud'}`}>
            {isLegitimate ? 'Transaction Legitimate' : 'Fraud Detected'}
          </div>
          <div className="verdict-sub">
            ID: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{result.transaction_id}</span>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <RiskBadge level={result.risk_level} size="sm" />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="result-metrics-row">
        {/* Gauge */}
        <div className="result-metric-cell" style={{ gridColumn: '1 / 2', padding: '24px 20px' }}>
          <GaugeChart value={result.risk_score} riskLevel={result.risk_level} label="Risk Score" size={140} />
        </div>

        {/* Fraud Probability */}
        <div className="result-metric-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px 28px' }}>
          <div className="result-metric-label">Fraud Probability</div>
          <div className="result-metric-value" style={{ color, fontSize: 36, marginTop: 8 }}>
            {probPercent}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
          </div>
          <div className="prob-bar-track" style={{ width: '100%', marginTop: 12 }}>
            <div
              className="prob-bar-fill"
              style={{
                width: `${result.fraud_probability * 100}%`,
                background: color,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>0%</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>100%</span>
          </div>
        </div>

        {/* Risk Level Detail */}
        <div className="result-metric-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px 28px', gap: 10 }}>
          <div className="result-metric-label">Risk Level</div>
          <div style={{ marginTop: 4 }}>
            <RiskBadge level={result.risk_level} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
              <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: RISK_PROB_COLORS[lvl],
                  opacity: result.risk_level === lvl ? 1 : 0.25,
                }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: result.risk_level === lvl ? 700 : 400,
                  color: result.risk_level === lvl ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {lvl} {lvl === 'LOW' ? '(0–30)' : lvl === 'MEDIUM' ? '(31–70)' : '(71–100)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
