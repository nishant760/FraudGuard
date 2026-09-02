import { useState } from 'react';
import { predictTransaction } from '../api/fraud';
import type { TransactionPredictRequest, PredictResponse } from '../types';
import ResultPanel from '../components/ui/ResultPanel';
import GlowingCard from '../components/ui/GlowingCard';
import KineticTitle from '../components/ui/KineticTitle';
import { Button } from '@/components/ui/stateful-button';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { triggerRiskDots } from '../lib/dotsEvent';

const DEFAULTS: TransactionPredictRequest = {
  TransactionAmt: 250.00,
  TransactionDT: 86400,
  card1: 9500,
  card2: 325,
  addr1: 315,
  ProductCD: 'W',
  card4: 'visa',
  card6: 'debit',
  P_emaildomain: 'gmail',
  C1: 1,
  C5: 0,
  id_present: 1,
};

const HIGH_RISK_PRESET: TransactionPredictRequest = {
  TransactionAmt: 5000.00,
  TransactionDT: 86400,
  card1: 12345,
  card2: 111,
  addr1: 999,
  ProductCD: 'C',
  card4: 'discover',
  card6: 'credit',
  P_emaildomain: 'anonymous',
  C1: 25,
  C5: 15,
  id_present: 0,
};

export default function Assessment() {
  const [form, setForm] = useState<TransactionPredictRequest>(DEFAULTS);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof TransactionPredictRequest, val: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const executeAssessment = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictTransaction(form);
      setResult(res);
      triggerRiskDots(res.risk_level);
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAssessment();
  };

  const resetForm = () => {
    setForm(DEFAULTS);
    setResult(null);
    setError(null);
  };

  return (
    <div className="page-content">
      {/* Page Header with Kinetic Text Animation */}
      <KineticTitle
        title="Transaction Fraud Assessment"
        subtitle="Submit transaction features to the ML inference engine and receive instant risk intelligence."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'start' }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: '1 1 500px', minWidth: 0 }}>
          <GlowingCard
            fromColor="rgba(99, 102, 241, 0.35)"
            viaColor="rgba(168, 85, 247, 0.2)"
            toColor="rgba(59, 130, 246, 0.35)"
            borderRadius="var(--radius-lg)"
            className="mb-6"
          >
            <div className="card" style={{ marginBottom: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Transaction Details</div>
                  <div className="card-subtitle">Fill in the details below to run a fraud risk assessment</div>
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
                      Transaction Amount <span className="form-label-hint">(in USD)</span>
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
                      Product / Service Type{' '}
                      <span className="form-label-hint" title="The category of the product or service being purchased.">
                        (what was purchased)
                      </span>
                    </label>
                    <select
                      className="form-select"
                      value={form.ProductCD ?? ''}
                      onChange={(e) => set('ProductCD', e.target.value)}
                    >
                      <option value="W">Web / Digital Products</option>
                      <option value="H">Home / Physical Goods</option>
                      <option value="C">Cash / ATM Withdrawal</option>
                      <option value="S">Services</option>
                      <option value="R">Retail / In-Store</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Card Details */}
              <div className="form-section">
                <div className="form-section-heading">Payment Card</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Card Account Tier{' '}
                      <span className="form-label-hint" title="Account category and tier (mapped to card1)">
                        (account tier)
                      </span>
                    </label>
                    <select
                      className="form-select"
                      value={form.card1 ?? 9500}
                      onChange={(e) => set('card1', parseFloat(e.target.value))}
                    >
                      <option value={9500}>Standard Consumer Account (Tier 9500)</option>
                      <option value={4461}>Premier / Platinum Rewards (Tier 4461)</option>
                      <option value={13800}>Commercial / Corporate Fleet (Tier 13800)</option>
                      <option value={16000}>Credit Builder / Student Account (Tier 16000)</option>
                      <option value={12345}>Disposable Prepaid / Virtual Gift (Tier 12345 - High Risk)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Issuing Bank{' '}
                      <span className="form-label-hint" title="The financial institution that issued the card (mapped to card2 code)">
                        (issuing bank)
                      </span>
                    </label>
                    <select
                      className="form-select"
                      value={form.card2 ?? 325}
                      onChange={(e) => set('card2', parseFloat(e.target.value))}
                    >
                      <option value={325}>JPMorgan Chase (Code 325)</option>
                      <option value={360}>Bank of America (Code 360)</option>
                      <option value={500}>Wells Fargo (Code 500)</option>
                      <option value={490}>Citigroup / Citibank (Code 490)</option>
                      <option value={387}>Capital One Financial (Code 387)</option>
                      <option value={450}>U.S. Bancorp / National (Code 450)</option>
                      <option value={321}>Barclays / European Issuer (Code 321)</option>
                      <option value={150}>Discover Bank / Regional (Code 150)</option>
                      <option value={222}>Goldman Sachs / Tech Co-brand (Code 222)</option>
                      <option value={111}>International / Private Bank (Code 111)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Network</label>
                    <select
                      className="form-select"
                      value={form.card4 ?? ''}
                      onChange={(e) => set('card4', e.target.value)}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Type</label>
                    <select
                      className="form-select"
                      value={form.card6 ?? ''}
                      onChange={(e) => set('card6', e.target.value)}
                    >
                      <option value="debit">Debit Card</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Billing & Activity */}
              <div className="form-section">
                <div className="form-section-heading">Billing & Activity Info</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Billing Region / Location{' '}
                      <span className="form-label-hint" title="Geographic billing area associated with transaction (mapped to addr1 code)">
                        (billing area)
                      </span>
                    </label>
                    <select
                      className="form-select"
                      value={form.addr1 ?? 315}
                      onChange={(e) => set('addr1', parseFloat(e.target.value))}
                    >
                      <option value={315}>California / West Coast (Region 315)</option>
                      <option value={204}>New York / Tri-State Metro (Region 204)</option>
                      <option value={299}>Texas / Southern Region (Region 299)</option>
                      <option value={126}>Florida / Southeast Coast (Region 126)</option>
                      <option value={441}>Illinois / Great Lakes & Midwest (Region 441)</option>
                      <option value={476}>Washington / Pacific Northwest (Region 476)</option>
                      <option value={181}>Massachusetts / New England (Region 181)</option>
                      <option value={327}>Georgia / Atlanta Southeast (Region 327)</option>
                      <option value={387}>Colorado / Mountain States (Region 387)</option>
                      <option value={999}>Unverified / High-Risk Offshore (Region 999)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Addresses Linked to Card{' '}
                      <span className="form-label-hint" title="How many different billing addresses have been used with this card (C1 feature)">
                        (address history)
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter address count (e.g. 1)"
                      className="form-input"
                      value={form.C1 ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        set('C1', val === '' ? undefined : parseInt(val, 10));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Recent Transaction Velocity{' '}
                      <span className="form-label-hint" title="Number of recent transactions using this card today (C5 feature)">
                        (swipes today)
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Enter number of swipes (e.g. 0)"
                      className="form-input"
                      value={form.C5 ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        set('C5', val === '' ? undefined : parseInt(val, 10));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Account & Identity */}
              <div className="form-section">
                <div className="form-section-heading">Account & Identity</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Purchaser's Email Provider</label>
                    <select
                      className="form-select"
                      value={form.P_emaildomain ?? ''}
                      onChange={(e) => set('P_emaildomain', e.target.value)}
                    >
                      <option value="gmail">Gmail (Google)</option>
                      <option value="yahoo">Yahoo Mail</option>
                      <option value="microsoft">Microsoft / Outlook</option>
                      <option value="anonymous">Anonymous / Unknown</option>
                      <option value="other">Other</option>
                      <option value="missing">Not Provided</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Identity Verified?{' '}
                      <span className="form-label-hint" title="Whether the buyer's identity was confirmed during this transaction. Unverified identity is a common fraud indicator.">
                        (was the buyer's identity confirmed)
                      </span>
                    </label>
                    <select
                      className="form-select"
                      value={form.id_present ?? 1}
                      onChange={(e) => set('id_present', parseInt(e.target.value))}
                    >
                      <option value={1}>Yes — Identity Verified</option>
                      <option value={0}>No — Identity Not Available</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <Button
                  type="submit"
                  onClick={executeAssessment}
                  loadingText="Evaluating Risk..."
                  successText="Assessment Ready"
                >
                  <Zap size={16} /> Run Assessment
                </Button>
              </div>
            </div>
          </GlowingCard>
        </form>

        {/* Result Sidebar */}
        <div style={{ position: 'sticky', top: 88, flex: '1 1 360px', maxWidth: '100%', minWidth: 0 }}>
          {error && (
            <div className="error-alert" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Regular card for Ready and Loading states */}
          {(!result || loading) && (
            <GlowingCard
              fromColor="rgba(99, 102, 241, 0.3)"
              viaColor="rgba(147, 197, 253, 0.2)"
              toColor="rgba(99, 102, 241, 0.3)"
              borderRadius="var(--radius-lg)"
            >
              <div className="assessment-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                {!loading ? (
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
                      Fill in the transaction details and click <strong>Run Assessment</strong> to receive an instant fraud prediction.
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div className="loading-spinner dark" style={{ margin: '0 auto 16px' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>
                      Running ML Inference...
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      XGBoost model evaluating 14 features
                    </div>
                  </div>
                )}
              </div>
            </GlowingCard>
          )}

          {/* 3D Perspective Card shown ONLY for the output result */}
          {result && !loading && (
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Assessment Intelligence</span>
                <button className="btn btn-outline btn-sm" onClick={() => setResult(null)}>
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
