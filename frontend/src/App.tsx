import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import WelcomeScreen from './components/WelcomeScreen';
import KafkaStream from './pages/KafkaStream';
import SecurityCenter from './pages/SecurityCenter';
import OtpQueue from './pages/OtpQueue';
import Assessment from './pages/Assessment';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import ConsumerTransactions from './pages/ConsumerTransactions';
import MosaicWaves from './components/ui/MosaicWaves';
import { StreamProvider } from './context/StreamContext';
import { AuthProvider, useAuth, type UserRole } from './context/AuthContext';
import type { RiskLevel } from './lib/dotsEvent';

const DEFAULT_DOTS_COLOR = '#10b981';
const RISK_DOTS_COLORS: Record<RiskLevel, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

// ── Route guard — silently redirects if role not permitted ────────────────────
function RoleGuard({
  allow,
  fallback,
  children,
}: {
  allow: UserRole[];
  fallback: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

// ── Main app content ───────────────────────────────────────────────────────────
function AppContent() {
  const { user } = useAuth();
  const [dotsColor, setDotsColor] = useState<string>(DEFAULT_DOTS_COLOR);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleRiskAssessed = (e: Event) => {
      const customEvent = e as CustomEvent<{ riskLevel: RiskLevel }>;
      const riskLevel = customEvent.detail?.riskLevel;
      if (!riskLevel) return;

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }

      if (riskLevel === 'LOW') {
        setDotsColor(DEFAULT_DOTS_COLOR);
      } else if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
        setDotsColor(RISK_DOTS_COLORS[riskLevel]);
        resetTimerRef.current = setTimeout(() => {
          setDotsColor(DEFAULT_DOTS_COLOR);
          resetTimerRef.current = null;
        }, 3000);
      }
    };

    window.addEventListener('fraudguard:risk-assessed', handleRiskAssessed);
    return () => {
      window.removeEventListener('fraudguard:risk-assessed', handleRiskAssessed);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const orgHome      = '/';           // Bank Ops lands on Kafka Stream
  const consumerHome = '/assessment'; // Consumer lands on Payment Risk Scanner

  return (
    <>
      <MosaicWaves
        dotSize={1.15}
        gridGap={9}
        color={dotsColor}
        backgroundColor="#ffffff"
        waveSpeed={0.85}
        waveFrequency={0.016}
        minOpacity={0.12}
        maxOpacity={0.92}
        interactive={true}
      />

      {!user ? (
        <WelcomeScreen />
      ) : (
        <BrowserRouter>
          <div className="app-layout">
            <Sidebar />
            <div className="app-main">
              <TopBar />
              <Routes>

                {/* ── ORGANISATION-ONLY ──────────────────────────────────── */}

                {/* Kafka real-time stream — org default home */}
                <Route
                  path="/"
                  element={
                    <RoleGuard allow={['ORGANISATION']} fallback={consumerHome}>
                      <KafkaStream />
                    </RoleGuard>
                  }
                />

                {/* Fleet OTP verification queue */}
                <Route
                  path="/otp-queue"
                  element={
                    <RoleGuard allow={['ORGANISATION']} fallback={consumerHome}>
                      <OtpQueue />
                    </RoleGuard>
                  }
                />

                {/* ML analytics & model performance */}
                <Route
                  path="/analytics"
                  element={
                    <RoleGuard allow={['ORGANISATION']} fallback={consumerHome}>
                      <Analytics />
                    </RoleGuard>
                  }
                />

                {/* Full audit log — org sees DB audit; consumer sees personal stream */}
                <Route
                  path="/transactions"
                  element={
                    user.role === 'ORGANISATION'
                      ? <Transactions />
                      : <ConsumerTransactions />
                  }
                />

                {/* ── CONSUMER-ONLY ─────────────────────────────────────── */}

                {/* Pre-payment safety scanner */}
                <Route
                  path="/assessment"
                  element={
                    <RoleGuard allow={['CONSUMER']} fallback={orgHome}>
                      <Assessment />
                    </RoleGuard>
                  }
                />

                {/* Personal 2FA & card security portal */}
                <Route
                  path="/security"
                  element={
                    <RoleGuard allow={['CONSUMER']} fallback="/otp-queue">
                      <SecurityCenter />
                    </RoleGuard>
                  }
                />

                {/* ── CATCH-ALL ─────────────────────────────────────────── */}
                <Route
                  path="*"
                  element={
                    <Navigate to={user.role === 'CONSUMER' ? consumerHome : orgHome} replace />
                  }
                />

              </Routes>
            </div>
          </div>
        </BrowserRouter>
      )}
    </>
  );
}

// ── Root export — stream runs continuously; auth sits inside it ───────────────
export default function App() {
  return (
    <AuthProvider>
      <StreamProvider>
        <AppContent />
      </StreamProvider>
    </AuthProvider>
  );
}
