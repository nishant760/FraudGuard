import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { getAnalyticsSummary, getRiskDistribution } from '../api/fraud';
import type { AnalyticsSummary, RiskDistributionResponse } from '../types';
import MetricCard from '../components/ui/MetricCard';
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
      <div className="page-header">
        <h1 className="page-title">Transaction Analytics</h1>
        <p className="page-subtitle">
          Evaluated transaction metrics from the XGBoost ML pipeline.
        </p>
      </div>

      <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
        Application Transaction Summary
      </div>
      {/* Summary Metric Cards */}
      <div className="metric-cards-grid mb-8">
        <MetricCard
          value={loading ? '—' : (summary?.total_transactions ?? 0).toLocaleString()}
          label="Total Transactions"
          icon={<Activity size={18} color="#4f46e5" />}
          iconBg="#eef2ff"
        />
        <MetricCard
          value={loading ? '—' : (summary?.total_fraud ?? 0).toLocaleString()}
          label="Fraud Detected"
          icon={<AlertTriangle size={18} color="#ef4444" />}
          iconBg="#fff1f2"
          valueColor="var(--risk-high-accent)"
        />
        <MetricCard
          value={loading ? '—' : (summary?.total_legitimate ?? 0).toLocaleString()}
          label="Legitimate"
          icon={<CheckCircle2 size={18} color="#10b981" />}
          iconBg="#ecfdf5"
          valueColor="var(--risk-low-accent)"
        />
        <MetricCard
          value={loading ? '—' : `${((summary?.fraud_rate ?? 0) * 100).toFixed(1)}`}
          label="Fraud Rate"
          icon={<TrendingUp size={18} color="#f59e0b" />}
          iconBg="#fffbeb"
          suffix="%"
        />
        <MetricCard
          value={loading ? '—' : `$${(summary?.avg_transaction_amount ?? 0).toFixed(0)}`}
          label="Avg. Transaction"
          icon={<DollarSign size={18} color="#4f46e5" />}
          iconBg="#eef2ff"
        />
      </div>

      {/* Charts Row */}
      <div className="analytics-grid mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Risk Distribution Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Risk Distribution</div>
              <div className="card-subtitle">Evaluated transaction breakdown</div>
            </div>
          </div>
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
        </div>

        {/* Model Info Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">ML Pipeline Overview</div>
              <div className="card-subtitle">Architecture details</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        </div>

      </div>
    </div>
  );
}
