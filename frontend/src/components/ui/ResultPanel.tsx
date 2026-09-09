import { useState } from 'react';
import type { PredictResponse, ExplanationFactor } from '../../types';
import RiskBadge from './RiskBadge';
import GaugeChart from './GaugeChart';
import { CardContainer, CardBody, CardItem } from './3d-card';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';

interface Props {
  result: PredictResponse;
}

const RISK_PROB_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

function FactorRow({ factor, color }: { factor: ExplanationFactor; color: string }) {
  const barWidth = `${Math.round(factor.relative_impact * 100)}%`;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {factor.feature}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: barWidth, borderRadius: 99, background: color, opacity: 0.85, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function ResultPanel({ result }: Props) {
  const [shapFilter, setShapFilter] = useState<'ALL' | 'RISK' | 'SAFE'>('ALL');
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

  const shap = result.shap_explanation;
  const contributions = shap?.contributions || [];

  const filteredContributions = contributions.filter((item) => {
    if (shapFilter === 'RISK') return item.direction === 'RISK_INCREASING';
    if (shapFilter === 'SAFE') return item.direction === 'RISK_DECREASING';
    return true;
  });

  const maxAbsShap = Math.max(...contributions.map((c) => Math.abs(c.shap_value)), 0.001);

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

        {/* ── WHY THIS PREDICTION? (SHAP Explainability) ── */}
        {result.explanation?.available &&
          ((result.explanation.top_risk_factors?.length || 0) > 0 ||
            (result.explanation.top_protective_factors?.length || 0) > 0) && (
          <CardItem translateZ="18" className="w-full" style={{ marginTop: 18 }}>
            <div
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 22px',
                border: '1px solid var(--border-base)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                <Sparkles size={16} color="#6366f1" />
                <span>WHY THIS PREDICTION?</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                {/* Risk Factors Column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
                    <TrendingUp size={15} />
                    <span>Top Risk Factors</span>
                  </div>
                  {result.explanation.top_risk_factors && result.explanation.top_risk_factors.length > 0 ? (
                    result.explanation.top_risk_factors.map((factor) => (
                      <FactorRow key={factor.feature} factor={factor} color="#ef4444" />
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No major risk factors</div>
                  )}
                </div>

                {/* Protective Factors Column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 12 }}>
                    <TrendingDown size={15} />
                    <span>Top Protective Factors</span>
                  </div>
                  {result.explanation.top_protective_factors && result.explanation.top_protective_factors.length > 0 ? (
                    result.explanation.top_protective_factors.map((factor) => (
                      <FactorRow key={factor.feature} factor={factor} color="#10b981" />
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No major protective factors</div>
                  )}
                </div>
              </div>

              {/* Exact Disclaimer */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-base)', display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Factors are generated using SHAP model explanations and describe why the XGBoost model produced this assessment — not why fraud occurred in reality. Relative impact bars show proportional contribution among displayed factors only.</span>
              </div>
            </div>
          </CardItem>
        )}

        {/* ── Interactive Detailed SHAP Per-Feature Attribution ── */}
        {shap && (
          <CardItem translateZ="16" className="w-full" style={{ marginTop: 18 }}>
            <div
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 22px',
                border: '1px solid var(--border-base)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Sparkles size={16} color="#6366f1" />
                    <span>Raw Per-Feature TreeSHAP Force Values</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Exact per-feature Shapley force values driving this transaction's risk score (Base logit: {shap.base_value})
                  </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShapFilter('ALL')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: shapFilter === 'ALL' ? '1px solid #6366f1' : '1px solid var(--border-base)',
                      background: shapFilter === 'ALL' ? '#6366f1' : 'var(--bg-card)',
                      color: shapFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    All Factors ({contributions.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setShapFilter('RISK')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: shapFilter === 'RISK' ? '1px solid #ef4444' : '1px solid var(--border-base)',
                      background: shapFilter === 'RISK' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                      color: shapFilter === 'RISK' ? '#ef4444' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <TrendingUp size={12} color="#ef4444" />
                    Risk Drivers (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShapFilter('SAFE')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: shapFilter === 'SAFE' ? '1px solid #10b981' : '1px solid var(--border-base)',
                      background: shapFilter === 'SAFE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                      color: shapFilter === 'SAFE' ? '#10b981' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <TrendingDown size={12} color="#10b981" />
                    Safety Factors (-)
                  </button>
                </div>
              </div>

              {/* Feature Attribution Force Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {filteredContributions.slice(0, 10).map((item) => {
                  const isRisk = item.direction === 'RISK_INCREASING';
                  const barWidth = `${Math.min(100, Math.max(8, (Math.abs(item.shap_value) / maxAbsShap) * 100))}%`;
                  const barColor = isRisk ? '#ef4444' : '#10b981';
                  const barBg = isRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';

                  return (
                    <div
                      key={item.feature}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-base)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {/* Top Row: Name, Category, Value & SHAP Score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.display_name}
                          </span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                            {item.category}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Weight: <strong>{item.impact_pct}%</strong>
                          </span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 13,
                              color: barColor,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: barBg,
                            }}
                          >
                            {isRisk ? '+' : ''}{item.shap_value.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Force Attribution Bar */}
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: barWidth,
                            height: '100%',
                            background: barColor,
                            borderRadius: 3,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      {/* Explanation Context */}
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Info size={11} color="var(--text-muted)" />
                        <span>{item.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Summary Callout */}
              {shap.top_risk_drivers.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isHigh ? 'rgba(239, 68, 68, 0.08)' : isMedium ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                    border: isHigh ? '1px solid rgba(239, 68, 68, 0.25)' : isMedium ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Primary Risk Catalysts:</strong>{' '}
                  {shap.top_risk_drivers.join(' · ')}
                </div>
              )}
            </div>
          </CardItem>
        )}
      </CardBody>
    </CardContainer>
  );
}
