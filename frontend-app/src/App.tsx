import React, { useState, useEffect } from 'react';
import { GatewayPage } from './pages/GatewayPage';
import { StudentPortal } from './pages/StudentPortal';
import { AdminPortal } from './pages/AdminPortal';
import { ReadingRuler } from './components/common/ReadingRuler';
import { AccessibilityToolbar } from './components/common/AccessibilityToolbar';

export function App() {
  const [portal, setPortal] = useState<'gateway' | 'student' | 'admin'>(() => {
    const saved = localStorage.getItem('unfold_active_portal');
    return (saved as 'student' | 'admin') || 'gateway';
  });

  const handleSelectPortal = (p: 'student' | 'admin') => {
    setPortal(p);
    localStorage.setItem('unfold_active_portal', p);
  };

  const handleBackToGateway = () => {
    setPortal('gateway');
    localStorage.removeItem('unfold_active_portal');
  };

  return (
    <div className="min-h-screen relative flex flex-col font-lexend transition-colors duration-200">
      {/* Dyslexia Reading Ruler Overlay */}
      <ReadingRuler />

      {/* Conditional Portal Rendering */}
      {portal === 'gateway' && (
        <div className="flex-1 flex flex-col">
          {/* Top Bar with Accessibility Toolbar for Gateway */}
          <header className="px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                📖
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                Unfold
              </span>
            </div>
            <AccessibilityToolbar />
          </header>

          <main className="flex-1 flex items-center justify-center">
            <GatewayPage onSelectPortal={handleSelectPortal} />
          </main>
        </div>
      )}

      {portal === 'student' && <StudentPortal onBackToGateway={handleBackToGateway} />}

      {portal === 'admin' && <AdminPortal onBackToGateway={handleBackToGateway} />}
    </div>
  );
}

export default App;
