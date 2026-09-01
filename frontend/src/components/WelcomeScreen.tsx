import { Shield } from 'lucide-react';
import './WelcomeScreen.css';

interface Props {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: Props) {
  return (
    <div className="welcome-container">
      {/* Safe, non-interfering background glow layers */}
      <div className="welcome-bg-glow-1" />
      <div className="welcome-bg-glow-2" />
      
      <div className="welcome-content">
        <div className="welcome-icon-wrapper">
          <Shield size={40} color="white" strokeWidth={2.5} />
        </div>
        
        <h1 className="welcome-title">FraudGuard AI</h1>
        <p className="welcome-subtitle">
          Machine Learning-Based Transaction Fraud Detection and Risk Assessment
        </p>

        {/* Informational Architecture Labels */}
        <div className="welcome-tags">
          <span className="welcome-tag">XGBoost Model</span>
          <span className="welcome-tag">IEEE-CIS Dataset</span>
          <span className="welcome-tag">SQLite Storage</span>
        </div>
        
        <button className="welcome-btn" onClick={onEnter}>
          Enter Dashboard &rarr;
        </button>
      </div>
    </div>
  );
}
