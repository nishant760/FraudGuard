import type { PredictResponse } from '../../types';
import RiskBadge from './RiskBadge';
import GaugeChart from './GaugeChart';
import { CardContainer, CardBody, CardItem } from './3d-card';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface Props {
  result: PredictResponse;
}

const RISK_PROB_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export default function ResultPanel({ result }: Props) {
  const isLow = result.risk_level === 'LOW';
  const isMedium = result.risk_level === 'MEDIUM';
  const isHigh = result.risk_level === 'HIGH';

  const bannerClass = isLow ? 'legitimate' : isMedium ? 'medium' : 'fraud';
  const verdictLabel = isLow
    ? 'Transaction Legitimate'
    : isMedium
    ? 'Suspicious Activity'
    : 'Fraud Detected';

  const probPercent = (result.fraud_probability * 100).toFixed(2);
  const color = RISK_PROB_COLORS[result.risk_level] || '#6366f1';

  return (
    <CardContainer className="w-full">
      <CardBody className={`card-3d-body--${result.risk_level.toLowerCase()}`}>
        {/* Verdict Banner with 3D elevation */}
        <CardItem translateZ="15" className="w-full">
          <div className={`result-verdict-banner ${bannerClass}`}>
            <div className={`verdict-icon ${bannerClass}`}>
              {isLow && <ShieldCheck size={22} color="white" strokeWidth={2.5} />}
              {isMedium && <AlertTriangle size={22} color="white" strokeWidth={2.5} />}
              {isHigh && <ShieldAlert size={22} color="white" strokeWidth={2.5} />}
            </div>
            <div>
              <div className={`verdict-label ${bannerClass}`}>
                {verdictLabel}
              </div>
              <div className="verdict-sub">
                ID: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{result.transaction_id}</span>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <RiskBadge level={result.risk_level} size="sm" />
              </div>
            </div>
          </div>
        </CardItem>

        {/* Metrics Row */}
        <div className="result-metrics-row" style={{ marginTop: 14 }}>
          {/* Gauge with gentle subtle 3D depth */}
          <CardItem translateZ="22" className="w-full">
            <div className="result-metric-cell" style={{ padding: '18px 16px', height: '100%' }}>
              <GaugeChart value={result.risk_score} riskLevel={result.risk_level} label="Risk Score" size={135} />
            </div>
          </CardItem>

          {/* Fraud Probability */}
          <CardItem translateZ="18" className="w-full">
            <div className="result-metric-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px 22px', height: '100%' }}>
              <div className="result-metric-label">Fraud Probability</div>
              <div className="result-metric-value" style={{ color, fontSize: 34, marginTop: 6 }}>
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
          </CardItem>

          {/* Risk Level & Distribution Detail */}
          <CardItem translateZ="12" className="w-full">
            <div className="result-metric-cell" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px 22px', gap: 10, height: '100%' }}>
              <div className="result-metric-label">Risk Distribution & Level</div>
              <div style={{ marginTop: 2 }}>
                <RiskBadge level={result.risk_level} />
              </div>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
                  <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
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
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}

