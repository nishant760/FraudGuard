import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import WelcomeScreen from './components/WelcomeScreen';
import Assessment from './pages/Assessment';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import BlinkingDots from './components/ui/BlinkingDots';
import type { RiskLevel } from './lib/dotsEvent';

const DEFAULT_DOTS_COLOR = '#10b981'; // Original emerald green
const RISK_DOTS_COLORS: Record<RiskLevel, string> = {
  LOW: '#10b981',    // Low risk: no change, stays original green
  MEDIUM: '#f59e0b', // Medium risk: warm amber
  HIGH: '#ef4444',   // High risk: alert crimson red
};

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [dotsColor, setDotsColor] = useState<string>(DEFAULT_DOTS_COLOR);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleRiskAssessed = (e: Event) => {
      const customEvent = e as CustomEvent<{ riskLevel: RiskLevel }>;
      const riskLevel = customEvent.detail?.riskLevel;

      if (!riskLevel) return;

      // Clear any existing active countdown
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }

      if (riskLevel === 'LOW') {
        // Low risk: no change, stays original green
        setDotsColor(DEFAULT_DOTS_COLOR);
      } else if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
        // Change color of the dots to match transaction risk level
        setDotsColor(RISK_DOTS_COLORS[riskLevel]);

        // Keep it for 3 seconds, then return to original green
        resetTimerRef.current = setTimeout(() => {
          setDotsColor(DEFAULT_DOTS_COLOR);
          resetTimerRef.current = null;
        }, 3000);
      }
    };

    window.addEventListener('fraudguard:risk-assessed', handleRiskAssessed);
    return () => {
      window.removeEventListener('fraudguard:risk-assessed', handleRiskAssessed);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Background Animated Blinking Dots Grid */}
      <BlinkingDots
        dotSize={1.15}
        gridGap={9}
        color={dotsColor}
        backgroundColor="#ffffff"
        twinkleSpeed={0.75}
        twinkleStrength={0.95}
        minBrightness={0.11}
        maxOpacity={0.95}
        interactive={true}
      />

      {!hasEntered ? (
        <WelcomeScreen onEnter={() => setHasEntered(true)} />
      ) : (
        <BrowserRouter>
          {/* Main Layout Container */}
          <div className="app-layout">
            <Sidebar />
            <div className="app-main">
              <TopBar />
              <Routes>
                <Route path="/" element={<Assessment />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      )}
    </>
  );
}
