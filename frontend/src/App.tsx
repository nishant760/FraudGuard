import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import WelcomeScreen from './components/WelcomeScreen';
import Assessment from './pages/Assessment';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  if (!hasEntered) {
    return <WelcomeScreen onEnter={() => setHasEntered(true)} />;
  }

  return (
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
  );
}
