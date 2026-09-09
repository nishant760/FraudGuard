import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { getAnalyticsSummary, getRiskDistribution, getGlobalShapImportance } from '../api/fraud';
import type { AnalyticsSummary, RiskDistributionResponse, GlobalShapItem } from '../types';
import MetricCard from '../components/ui/MetricCard';
import ModalCard from '../components/ui/ModalCard';
import KineticTitle from '../components/ui/KineticTitle';
import { useStream } from '../context/StreamContext';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Sparkles } from 'lucide-react';


const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const CUSTOM_TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 4px 6px -1px rgba(15,23,42,.07)',
  fontSize: 13,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Amount & Volume': '#6366f1',
  'Frequency & Velocity': '#ec4899',
  'Identity & Device': '#10b981',
  'Payment Method': '#f59e0b',
  'Transaction Type': '#8b5cf6',
  'Temporal Behavior': '#06b6d4',
  'Geographic & Billing': '#14b8a6',
  'Identity & Communication': '#3b82f6',
  'General': '#64748b',
};

export default function Analytics() {
  const {
    transactions: streamTxns,
    totalCount: streamTotal,
    fraudCount: streamFraud,
    totalVolume: streamVol,
    isStreaming,
    lastLatency,
  } = useStream();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [distribution, setDistribution] = useState<RiskDistributionResponse | null>(null);
  const [globalShap, setGlobalShap] = useState<GlobalShapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsSummary(), getRiskDistribution(), getGlobalShapImportance()])
      .then(([s, d, g]) => {
        setSummary(s);
        setDistribution(d);
        setGlobalShap(g.features || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute live stream risk distribution
  const streamDistribution = useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;
    for (const t of streamTxns) {
      if (t.risk_level === 'LOW') low++;
      else if (t.risk_level === 'MEDIUM') med++;
      else if (t.risk_level === 'HIGH') high++;
    }
    return { low, med, high };
  }, [streamTxns]);

  // Combined metrics (Database + Live Kafka Stream)
  const totalTransactions = (summary?.total_transactions ?? 0) + streamTotal;
  const totalFraud = (summary?.total_fraud ?? 0) + streamFraud;
  const totalLegit = (summary?.total_legitimate ?? 0) + (streamTotal - streamFraud);
  const fraudRate = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
  const totalAmountSum = ((summary?.avg_transaction_amount ?? 0) * (summary?.total_transactions ?? 0)) + streamVol;
  const avgAmount = totalTransactions > 0 ? totalAmountSum / totalTransactions : 0;

  // Combined Risk distribution
  const dbLow = distribution?.distribution.find((d) => d.risk_level === 'LOW')?.count ?? 0;
  const dbMed = distribution?.distribution.find((d) => d.risk_level === 'MEDIUM')?.count ?? 0;
  const dbHigh = distribution?.distribution.find((d) => d.risk_level === 'HIGH')?.count ?? 0;

  const combinedLow = dbLow + streamDistribution.low;
  const combinedMed = dbMed + streamDistribution.med;
  const combinedHigh = dbHigh + streamDistribution.high;
  const combinedTotalRisk = combinedLow + combinedMed + combinedHigh;

  const pieData = useMemo(() => {
    if (combinedTotalRisk === 0) return [];
    return [
      { name: 'LOW', value: combinedLow, pct: (combinedLow / combinedTotalRisk) * 100 },
      { name: 'MEDIUM', value: combinedMed, pct: (combinedMed / combinedTotalRisk) * 100 },
      { name: 'HIGH', value: combinedHigh, pct: (combinedHigh / combinedTotalRisk) * 100 },
    ];
  }, [combinedLow, combinedMed, combinedHigh, combinedTotalRisk]);

  return (
    <div className="page-content">
      <KineticTitle
        title="Transaction Analytics & ML Intelligence"
        subtitle="Consolidated real-time telemetry from IEEE-CIS ML pipeline and live Kafka PaySim event stream."
      />

      {/* Live Stream Status Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 18px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isStreaming ? '#10b981' : '#f59e0b',
            boxShadow: isStreaming ? '0 0 8px #10b981' : 'none'
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Kafka Streaming Pipeline: {isStreaming ? 'Active (Continuous Ingestion)' : 'Paused'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span><strong>{streamTotal.toLocaleString()}</strong> live events ingested</span>
          <span>Avg Latency: <strong>{lastLatency.toFixed(1)}ms</strong></span>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="metric-cards-grid mb-6">
        <MetricCard
          label="Total Transactions Analyzed"
          value={totalTransactions.toLocaleString()}
          icon={<Activity size={18} color="#4f46e5" />}
          iconBg="rgba(79, 70, 229, 0.12)"
          suffix="evaluated"
          valueColor="#4f46e5"
          fromColor="rgba(79, 70, 229, 0.35)"
        />
        <MetricCard
          label="Fraud Detected & Blocked"
          value={totalFraud.toLocaleString()}
          icon={<AlertTriangle size={18} color="#ef4444" />}
          iconBg="rgba(239, 68, 68, 0.12)"
          suffix="flagged"
          valueColor="#ef4444"
          fromColor="rgba(239, 68, 68, 0.35)"
        />
        <MetricCard
          label="Legitimate / Auto-Cleared"
          value={totalLegit.toLocaleString()}
          icon={<CheckCircle2 size={18} color="#10b981" />}
          iconBg="rgba(16, 185, 129, 0.12)"
          suffix="cleared"
          valueColor="#10b981"
          fromColor="rgba(16, 185, 129, 0.35)"
        />
        <MetricCard
          label="Portfolio Fraud Rate"
          value={`${fraudRate.toFixed(2)}%`}
          icon={<TrendingUp size={18} color="#ec4899" />}
          iconBg="rgba(236, 72, 153, 0.12)"
          suffix="overall"
          valueColor="#ec4899"
          fromColor="rgba(236, 72, 153, 0.35)"
        />
        <MetricCard
          label="Avg Transaction Amount"
          value={`$${avgAmount.toFixed(2)}`}
          icon={<DollarSign size={18} color="#f59e0b" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          suffix="per txn"
          valueColor="#f59e0b"
          fromColor="rgba(245, 158, 11, 0.35)"
        />
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="analytics-grid" style={{ marginBottom: 24 }}>
        {/* Risk Level Distribution Card */}
        <ModalCard
          title="Consolidated Risk Distribution"
          subtitle="Real-time multi-tier transaction risk segmentation"
          fromColor="rgba(99, 102, 241, 0.35)"
          viaColor="rgba(168, 85, 247, 0.25)"
          toColor="rgba(236, 72, 153, 0.35)"
          modalContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'center', padding: '10px 0' }}>
                <PieChart width={220} height={220}>
                  <Pie
                    data={pieData}
                    cx={105}
                    cy={105}
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, _n: any, props: any) =>
                      [`${v} (${props?.payload?.pct ? Number(props.payload.pct).toFixed(1) : '0'}%)`, props?.payload?.name || '']
                    }
                    contentStyle={CUSTOM_TOOLTIP_STYLE}
                  />
                </PieChart>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: RISK_COLORS[d.name], flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name} Risk Tier</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.value.toLocaleString()} transactions ({d.pct?.toFixed(1)}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="loading-spinner dark" style={{ margin: '0 auto 12px' }} />
              <div className="empty-state-title">Loading distribution...</div>
            </div>
          ) : combinedTotalRisk === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-title" style={{ color: 'var(--text-muted)' }}>No transaction data available yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', padding: '20px 0' }}>
              <PieChart width={180} height={180}>
                <Pie
                  data={pieData}
                  cx={85}
                  cy={85}
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, _n: any, props: any) =>
                    [`${v} (${props?.payload?.pct ? Number(props.payload.pct).toFixed(1) : '0'}%)`, props?.payload?.name || '']
                  }
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS[d.name], flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.value.toLocaleString()} · {d.pct?.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalCard>
      </div>

      {/* ── Full Width Global SHAP Feature Importance & Interpretability Matrix ── */}
      <div className="card" style={{ padding: 24, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Sparkles size={18} color="#6366f1" />
              <span>Global SHAP Feature Importance &amp; Model Interpretability Matrix</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Relative feature impact ranking across all decision splits in the trained XGBoost model (TreeSHAP Gain metric).
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
            <span>Exact TreeSHAP Attribution</span>
          </div>
        </div>

        {/* Global SHAP Ranking Bar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
          {globalShap.slice(0, 10).map((item, idx) => {
            const catColor = CATEGORY_COLORS[item.category] || '#6366f1';
            const widthPct = Math.min(100, Math.max(8, item.importance_pct * 4));

            return (
              <div
                key={item.feature}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-base)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#ffffff',
                      background: '#4f46e5',
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.display_name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${catColor}18`,
                      color: catColor,
                      border: `1px solid ${catColor}33`,
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${catColor}, #4f46e5)`,
                      borderRadius: 3,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Importance Weight: <strong style={{ color: 'var(--text-primary)' }}>{item.importance_pct}%</strong></span>
                  <span>Gain: <strong>{item.importance_score.toLocaleString()}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
