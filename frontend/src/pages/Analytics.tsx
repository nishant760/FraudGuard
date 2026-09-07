import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { getAnalyticsSummary, getRiskDistribution } from '../api/fraud';
import type { AnalyticsSummary, RiskDistributionResponse } from '../types';
import MetricCard from '../components/ui/MetricCard';
import ModalCard from '../components/ui/ModalCard';
import KineticTitle from '../components/ui/KineticTitle';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

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

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [distribution, setDistribution] = useState<RiskDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsSummary(), getRiskDistribution()])
      .then(([s, d]) => { setSummary(s); setDistribution(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pieData = distribution?.distribution.map((d) => ({
    name: d.risk_level,
    value: d.count,
    pct: d.percentage,
  })) ?? [];

  const totalRiskCount = pieData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="page-content">
      <KineticTitle
        title="Transaction Analytics"
        subtitle="Evaluated transaction metrics from the XGBoost ML pipeline."
      />

      <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
        Application Transaction Summary
      </div>
      {/* Summary Metric Cards with theme-matched subtle glows */}
      <div className="metric-cards-grid mb-8">
        <MetricCard
          value={loading ? '—' : (summary?.total_transactions ?? 0).toLocaleString()}
          label="Total Transactions"
          icon={<Activity size={18} color="#4f46e5" />}
          iconBg="#eef2ff"
          fromColor="rgba(79, 70, 229, 0.45)"
          viaColor="rgba(99, 102, 241, 0.3)"
          toColor="rgba(129, 140, 248, 0.45)"
        />
        <MetricCard
          value={loading ? '—' : (summary?.total_fraud ?? 0).toLocaleString()}
          label="Fraud Detected"
          icon={<AlertTriangle size={18} color="#ef4444" />}
          iconBg="#fff1f2"
          valueColor="var(--risk-high-accent)"
          fromColor="rgba(239, 68, 68, 0.45)"
          viaColor="rgba(244, 63, 94, 0.3)"
          toColor="rgba(251, 113, 133, 0.45)"
        />
        <MetricCard
          value={loading ? '—' : (summary?.total_legitimate ?? 0).toLocaleString()}
          label="Legitimate"
          icon={<CheckCircle2 size={18} color="#10b981" />}
          iconBg="#ecfdf5"
          valueColor="var(--risk-low-accent)"
          fromColor="rgba(16, 185, 129, 0.45)"
          viaColor="rgba(5, 150, 105, 0.3)"
          toColor="rgba(52, 211, 153, 0.45)"
        />
        <MetricCard
          value={loading ? '—' : `${((summary?.fraud_rate ?? 0) * 100).toFixed(1)}`}
          label="Fraud Rate"
          icon={<TrendingUp size={18} color="#f59e0b" />}
          iconBg="#fffbeb"
          suffix="%"
          fromColor="rgba(245, 158, 11, 0.45)"
          viaColor="rgba(217, 119, 6, 0.3)"
          toColor="rgba(251, 191, 36, 0.45)"
        />
        <MetricCard
          value={loading ? '—' : `$${(summary?.avg_transaction_amount ?? 0).toFixed(0)}`}
          label="Avg. Transaction"
          icon={<DollarSign size={18} color="#4f46e5" />}
          iconBg="#eef2ff"
          fromColor="rgba(59, 130, 246, 0.4)"
          viaColor="rgba(79, 70, 229, 0.3)"
          toColor="rgba(99, 102, 241, 0.4)"
        />
      </div>

      {/* Charts Row */}
      <div className="analytics-grid mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>        {/* Risk Distribution Donut with Expandable Modal Card */}
        <ModalCard
          title="Risk Distribution"
          subtitle="Evaluated transaction breakdown"
          fromColor="rgba(99, 102, 241, 0.35)"
          viaColor="rgba(168, 85, 247, 0.25)"
          toColor="rgba(59, 130, 246, 0.35)"
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

              {/* Deep Dive Breakdown Table */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Risk Policy &amp; Automated Actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    <span>Tier</span>
                    <span>Risk Score</span>
                    <span>Volume</span>
                    <span>System Policy</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', padding: '10px 12px', borderBottom: '1px solid var(--border-base)', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--risk-low-text)' }}>LOW</span>
                    <span>0 – 30</span>
                    <span>{distribution?.distribution.find(d => d.risk_level === 'LOW')?.count ?? 0}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Auto-Approve / Instant Settlement</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', padding: '10px 12px', borderBottom: '1px solid var(--border-base)', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--risk-medium-text)' }}>MEDIUM</span>
                    <span>31 – 70</span>
                    <span>{distribution?.distribution.find(d => d.risk_level === 'MEDIUM')?.count ?? 0}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>Step-Up 2FA / Manual Review Queue</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', padding: '10px 12px', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--risk-high-text)' }}>HIGH</span>
                    <span>71 – 100</span>
                    <span>{distribution?.distribution.find(d => d.risk_level === 'HIGH')?.count ?? 0}</span>
                    <span style={{ color: 'var(--risk-high-accent)', fontWeight: 600 }}>Immediate Decline &amp; Freeze Card</span>
                  </div>
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
          ) : totalRiskCount === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-title" style={{ color: 'var(--text-muted)' }}>No transaction data available yet.</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>Run an assessment to generate analytics.</div>
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

        {/* Model Info Card with Expandable Modal */}
        <ModalCard
          title="ML Pipeline Overview"
          subtitle="Architecture details"
          fromColor="rgba(59, 130, 246, 0.35)"
          viaColor="rgba(99, 102, 241, 0.25)"
          toColor="rgba(16, 185, 129, 0.35)"
          modalContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--primary-50)', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--primary-100)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-700)', marginBottom: 4 }}>IEEE-CIS Fraud Detection Pipeline</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  State-of-the-art gradient boosted tree ensemble trained to evaluate real-time card-not-present (CNP) and electronic payment transaction risk with sub-5ms latency.
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Architecture Specifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Dataset Source', value: 'IEEE-CIS Fraud Detection Benchmark (590,000+ Transactions)' },
                    { label: 'Model Algorithm', value: 'XGBoost (eXtreme Gradient Boosting Classifier)' },
                    { label: 'Feature Engineering', value: '11 Input Features Engineered into 14 ML Predictors' },
                    { label: 'Preprocessor Pipeline', value: 'ColumnTransformer (OneHotEncoder + StandardScaler + Log Transform)' },
                    { label: 'Inference Latency', value: '< 5ms per transaction prediction' },
                    { label: 'Persistence Store', value: 'SQLite / SQLAlchemy Audit Log & Analytics DB' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid var(--border-base)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
            {[
              { label: 'Dataset', value: 'IEEE-CIS Fraud Detection Dataset' },
              { label: 'Model', value: 'XGBoost Classifier' },
              { label: 'Input Processing', value: 'Preprocessed Transaction Features' },
              { label: 'Features Used', value: '14 Features Used for Prediction' },
              { label: 'Output', value: 'Fraud Prediction, Probability, and Risk Level' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 10, borderBottom: '1px solid var(--border-base)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
              </div>
            ))}
          </div>
        </ModalCard>

      </div>
    </div>
  );
}
