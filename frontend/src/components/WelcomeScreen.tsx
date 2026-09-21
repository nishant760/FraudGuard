import { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import InfiniteMovingCards, { type TestimonialItem } from './ui/infinite-moving-cards';
import { SparklesCore } from './ui/sparkles';
import { useAuth, ACCOUNTS } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import './WelcomeScreen.css';

// ── All demo credentials shown in the sign-in table ─────────────────────────
const DEMO_CREDENTIALS = [
  // Organisation
  { email: 'admin@fraudguard-bank.com',  password: 'Bank@2025',  role: 'ORGANISATION' as UserRole, label: 'Organisation — Bank Risk Ops' },
  // Consumers — all 8 stream customer profiles
  { email: 'alex.johnson@gmail.com',     password: 'Alex@123',   role: 'CONSUMER' as UserRole,      label: 'Consumer — Alex M. Johnson' },
  { email: 'priya.sharma@gmail.com',     password: 'Priya@123',  role: 'CONSUMER' as UserRole,      label: 'Consumer — Priya Sharma' },
  { email: 'michael.torres@yahoo.com',   password: 'Mike@123',   role: 'CONSUMER' as UserRole,      label: 'Consumer — Michael Torres' },
  { email: 'sandra.wu@outlook.com',      password: 'Sandra@123', role: 'CONSUMER' as UserRole,      label: 'Consumer — Sandra Wu' },
  { email: 'james.okafor@gmail.com',     password: 'James@123',  role: 'CONSUMER' as UserRole,      label: 'Consumer — James Okafor' },
  { email: 'laura.bianchi@icloud.com',   password: 'Laura@123',  role: 'CONSUMER' as UserRole,      label: 'Consumer — Laura Bianchi' },
  { email: 'raj.patel@gmail.com',        password: 'Raj@123',    role: 'CONSUMER' as UserRole,      label: 'Consumer — Raj Patel' },
  { email: 'emily.nakamura@proton.me',   password: 'Emily@123',  role: 'CONSUMER' as UserRole,      label: 'Consumer — Emily Nakamura' },
];

const testimonials: TestimonialItem[] = [
  { quote: 'Never ignore an unusual transaction. A few seconds of verification can prevent a major financial loss.', name: 'Fraud Awareness', title: 'Stay Alert' },
  { quote: 'If a transaction looks suspicious, pause before you proceed. Trust your instincts and verify the details.', name: 'Financial Safety', title: 'Think Before You Transact' },
  { quote: 'Fraudsters rely on urgency. Take your time, verify the transaction, and never let pressure make the decision for you.', name: 'Security Tip', title: "Don't Rush" },
  { quote: 'Monitor your transactions regularly. Early detection of unusual activity can make all the difference.', name: 'Fraud Prevention', title: 'Monitor Your Money' },
  { quote: "A transaction being successful doesn't always mean it's safe. Look for unusual patterns and investigate anything unexpected.", name: 'Transaction Security', title: 'Look Beyond Success' },
  { quote: 'Protect your finances by questioning transactions that do not match your usual spending behavior.', name: 'Smart Finance', title: 'Know Your Spending' },
  { quote: 'When fraud is detected early, the damage can often be reduced. Stay informed, stay vigilant, and act quickly.', name: 'Fraud Detection', title: 'Detect Early' },
  { quote: 'Your financial security starts with awareness. Every transaction deserves a second look when something feels unusual.', name: 'Financial Awareness', title: 'Stay One Step Ahead' },
];

// Suppress unused import warning — ACCOUNTS is imported to ensure types stay in sync
void ACCOUNTS;

export default function WelcomeScreen() {
  const { login } = useAuth();

  const [step, setStep]           = useState<'landing' | 'signin'>('landing');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(email.trim(), password);
    if (err) setError(err);
  };

  // Clicking a credential row auto-fills the form
  const fillCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  // ── Landing step (existing sparkles hero — untouched) ─────────────────────
  if (step === 'landing') {
    return (
      <div className="welcome-container">
        <div className="welcome-bg-glow-1" />
        <div className="welcome-bg-glow-2" />
        <div className="welcome-content">
          <div className="welcome-icon-wrapper">
            <Shield size={28} color="white" strokeWidth={2.5} />
          </div>

          <div className="sparkles-title-wrapper">
            <h1 className="sparkles-title">
              FraudGuard <span className="sparkles-title-accent">AI</span>
            </h1>
            <div className="sparkles-field-container">
              <div className="sparkles-beam-indigo-blur" />
              <div className="sparkles-beam-indigo-sharp" />
              <div className="sparkles-beam-cyan-blur" />
              <div className="sparkles-beam-cyan-sharp" />
              <SparklesCore
                background="transparent"
                minSize={0.6}
                maxSize={1.8}
                particleDensity={800}
                className="w-full h-full"
                particleColor="#6366f1"
              />
              <div className="sparkles-radial-mask" />
            </div>
          </div>

          <p className="welcome-subtitle">
            Machine Learning-Based Transaction Fraud Detection and Risk Assessment
          </p>

          <button className="signin-get-started-btn" onClick={() => setStep('signin')}>
            Sign In
          </button>

          <InfiniteMovingCards items={testimonials} speed="normal" />
        </div>
      </div>
    );
  }

  // ── Sign-in step ───────────────────────────────────────────────────────────
  return (
    <div className="welcome-container">
      <div className="welcome-bg-glow-1" />
      <div className="welcome-bg-glow-2" />

      <div className="welcome-content">
        <div className="signin-card">

          {/* Header */}
          <div className="signin-card-header">
            <div className="signin-logo">
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="signin-brand">FraudGuard AI</div>
              <div className="signin-brand-sub">Risk Intelligence Platform</div>
            </div>
          </div>

          <h2 className="signin-title">Sign In</h2>
          <p className="signin-subtitle">Enter your credentials to access the dashboard.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="signin-form">
            <div className="signin-field-wrap">
              <label className="signin-label">Email address</label>
              <input
                type="email"
                className="signin-input"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
              />
            </div>

            <div className="signin-field-wrap">
              <label className="signin-label">Password</label>
              <div className="signin-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="signin-input signin-input-pw"
                  placeholder="••••••••"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
                <button
                  type="button"
                  className="signin-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="signin-error">{error}</p>}

            <button type="submit" className="signin-submit-btn">Sign In</button>
          </form>

          {/* Demo Credentials Table */}
          <div className="signin-creds-section">
            <div className="signin-creds-label">Demo Credentials</div>
            <div className="signin-creds-table">
              {DEMO_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="signin-cred-row"
                  onClick={() => fillCredentials(c.email, c.password)}
                >
                  <div className="signin-cred-left">
                    <span className="signin-cred-email">{c.email}</span>
                    <span className="signin-cred-role">{c.label}</span>
                  </div>
                  <div className="signin-cred-right">
                    <span className="signin-cred-pw">{c.password}</span>
                    <span className={`signin-cred-badge ${c.role === 'ORGANISATION' ? 'org' : 'consumer'}`}>
                      {c.role === 'ORGANISATION' ? 'Org' : 'Consumer'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="signin-creds-hint">Click any row to auto-fill</p>
          </div>

          <button className="signin-back-btn" onClick={() => { setStep('landing'); setEmail(''); setPassword(''); setError(''); }}>
            <ArrowLeft size={13} /> Back
          </button>
        </div>

        <InfiniteMovingCards items={testimonials} speed="normal" />
      </div>
    </div>
  );
}
