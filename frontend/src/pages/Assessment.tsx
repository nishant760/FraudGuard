import { useState } from 'react';
import { predictTransaction } from '../api/fraud';
import type { TransactionPredictRequest, PredictResponse } from '../types';
import ResultPanel from '../components/ui/ResultPanel';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';

const DEFAULTS: TransactionPredictRequest = {
  TransactionAmt: 250.00,
  TransactionDT: 86400,
  card1: 9500,
  card2: 325,
  addr1: 315,
  C1: 1,
  C5: 0,
  ProductCD: 'W',
  card4: 'visa',
  card6: 'debit',
  P_emaildomain: 'gmail',
  id_present: 1,
};

const HIGH_RISK_PRESET: TransactionPredictRequest = {
  TransactionAmt: 9999.99,
  TransactionDT: 7200,
  card1: 12345,
  card2: 111,
  addr1: 999,
  C1: 18,
  C5: 15,
  ProductCD: 'C',
  card4: 'discover',
  card6: 'credit',
  P_emaildomain: 'anonymous',
  id_present: 0,
};

export default function Assessment() {
  const [form, setForm] = useState<TransactionPredictRequest>(DEFAULTS);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof TransactionPredictRequest, val: string | number) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictTransaction(form);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(DEFAULTS);
    setResult(null);
    setError(null);
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Transaction Fraud Assessment</h1>
        <p className="page-subtitle">
          Submit transaction features to the ML inference engine and receive instant risk intelligence.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: '1 1 500px', minWidth: 0 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Transaction Details</div>
                <div className="card-subtitle">Numeric features for ML inference</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setForm(HIGH_RISK_PRESET)}
                  
                >
                  High Risk Preset
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={resetForm}
                  
                >
                  <RefreshCw size={13} />
                  Reset
                </button>
              </div>
            </div>

            {/* Section: Transaction Info */}
            <div className="form-section">
              <div className="form-section-heading">Transaction Info</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    TransactionAmt <span className="form-label-hint">(USD)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={form.TransactionAmt}
                    onChange={(e) => set('TransactionAmt', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    ProductCD <span className="form-label-hint" title="Dataset-defined product category used by the IEEE-CIS fraud detection model.">(Dataset Product Category)</span>
                  </label>
                  <select
                    className="form-select"
                    value={form.ProductCD ?? ''}
                    onChange={(e) => set('ProductCD', e.target.value)}
                  >
                    {['W', 'H', 'C', 'S', 'R'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Card Details */}
            <div className="form-section">
              <div className="form-section-heading">Card Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">card1 <span className="form-label-hint">(card ID)</span></label>
                  <input type="number" className="form-input" value={form.card1 ?? ''} onChange={(e) => set('card1', parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">card2 <span className="form-label-hint">(sub-attribute)</span></label>
                  <input type="number" className="form-input" value={form.card2 ?? ''} onChange={(e) => set('card2', parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">card4 <span className="form-label-hint">(network)</span></label>
                  <select className="form-select" value={form.card4 ?? ''} onChange={(e) => set('card4', e.target.value)}>
                    {['visa', 'mastercard', 'amex', 'discover'].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">card6 <span className="form-label-hint">(type)</span></label>
                  <select className="form-select" value={form.card6 ?? ''} onChange={(e) => set('card6', e.target.value)}>
                    {['debit', 'credit'].map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Address & Counts */}
            <div className="form-section">
              <div className="form-section-heading">Address & Count Features</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">addr1 <span className="form-label-hint">(billing region)</span></label>
                  <input type="number" className="form-input" value={form.addr1 ?? ''} onChange={(e) => set('addr1', parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">C1 <span className="form-label-hint">(billing count)</span></label>
                  <input type="number" className="form-input" value={form.C1 ?? ''} onChange={(e) => set('C1', parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">C5 <span className="form-label-hint">(Vesta count)</span></label>
                  <input type="number" className="form-input" value={form.C5 ?? ''} onChange={(e) => set('C5', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Section: Email & Identity */}
            <div className="form-section">
              <div className="form-section-heading">Email & Identity</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">P_emaildomain</label>
                  <select className="form-select" value={form.P_emaildomain ?? ''} onChange={(e) => set('P_emaildomain', e.target.value)}>
                    {['gmail', 'yahoo', 'microsoft', 'anonymous', 'other', 'missing'].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    id_present <span className="form-label-hint">(identity record)</span>
                  </label>
                  <select className="form-select" value={form.id_present ?? 1} onChange={(e) => set('id_present', parseInt(e.target.value))}>
                    <option value={1}>1 — Identity Present</option>
                    <option value={0}>0 — No Identity Record</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} >
                {loading ? (
                  <><div className="loading-spinner" /> Analyzing...</>
                ) : (
                  <><Zap size={16} /> Run Assessment</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Result Sidebar */}
        <div style={{ position: 'sticky', top: 88, flex: '1 1 350px', maxWidth: '100%', minWidth: 0 }}>
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--primary-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Zap size={24} color="var(--primary-600)" />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                  Ready for Assessment
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Fill in the transaction features and click <strong>Run Assessment</strong> to receive an instant fraud prediction.
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="loading-spinner dark" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>
                  Running ML Inference...
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  XGBoost model evaluating 14 features
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Assessment Result</span>
                <button className="btn btn-outline btn-sm" onClick={() => setResult(null)} >
                  Clear
                </button>
              </div>
              <ResultPanel result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
