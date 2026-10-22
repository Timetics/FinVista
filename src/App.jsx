import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import RoadmapSection from './components/RoadmapSection';
import Dashboard from './components/Dashboard';
import DemoUpload from './components/DemoUpload';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import { sampleTransactions } from './data/sampleData';
import { loadTransactions, saveTransactions } from './lib/supabaseTransactions';
import { visibleRows } from './lib/sessionScope';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, signOut, signingOut } = useAuth();
  const [activeSection, setActiveSection] = useState('hero');
  const [viewMode, setViewMode] = useState('homepage'); // 'homepage' | 'roadmap' | 'dashboard' | 'demo-upload'
  const [rows, setRows] = useState([]);
  const [rowsOwner, setRowsOwner] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  // The rows on screen always belong to a specific account. `rowsOwner`
  // records which one (`null` = rows produced in an anonymous session, e.g.
  // the built-in sample data).
  //
  // Deriving the visible rows from the current session means there is never a
  // moment where the state and the session disagree -- signing out explicitly,
  // an expired or revoked session, or signing out in another tab all hide the
  // previous user's financial data immediately.
  const currentOwner = user?.id ?? null;
  const transactions = visibleRows(rows, rowsOwner, currentOwner);
  const hasData = transactions.length > 0;

  // Replace the rows on screen, tagged as belonging to the account that is
  // signed in right now.
  const applyTransactions = useCallback((nextRows) => {
    setRows(nextRows);
    setRowsOwner(currentOwner);
  }, [currentOwner]);

  // Close auth modals once the user is authenticated
  useEffect(() => {
    if (user) {
      setShowSignIn(false);
      setShowSignUp(false);
    }
  }, [user]);

  // Load any previously saved transactions from Supabase.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    loadTransactions(user.id).then((saved) => {
      if (cancelled) return;
      if (saved.length > 0) {
        setRows(saved);
        setRowsOwner(user.id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Track active section on scroll if in homepage mode
  useEffect(() => {
    if (viewMode !== 'homepage') return;

    const handleScroll = () => {
      const sections = ['hero', 'features', 'how-it-works'];
      const scrollPos = window.scrollY + 200;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const handleNavigate = useCallback((sectionId) => {
    if (sectionId === 'demo-upload') {
      setViewMode('demo-upload');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'roadmap') {
      setViewMode('roadmap');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'dashboard') {
      if (!hasData) {
        applyTransactions(sampleTransactions);
        saveTransactions(sampleTransactions, user?.id).catch((err) =>
          console.error('[supabase] sample save failed:', err)
        );
      }
      setViewMode('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'hero' || sectionId === 'features' || sectionId === 'how-it-works') {
      setViewMode('homepage');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [hasData, user?.id, applyTransactions]);

  const handleLoadSample = useCallback(() => {
    applyTransactions(sampleTransactions);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveTransactions(sampleTransactions, user?.id).catch((err) =>
      console.error('[supabase] sample save failed:', err)
    );
  }, [user?.id, applyTransactions]);

  const handleLaunchDashboardFromScan = useCallback(async (scannedTransactions) => {
    applyTransactions(scannedTransactions);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveTransactions(scannedTransactions, user?.id).catch((err) =>
      console.error('[supabase] scan save failed:', err)
    );
  }, [user?.id, applyTransactions]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // The signed-out user's rows are no longer derived as visible, so the
      // dashboard is empty again. Drop back to the landing page so the user is
      // not left looking at an empty shell.
      setViewMode('homepage');
      setActiveSection('hero');
    } catch (err) {
      console.error('[auth] sign-out failed:', err);
    }
  }, [signOut]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar
        hasData={hasData}
        onNavigate={handleNavigate}
        activeSection={viewMode === 'dashboard' ? 'dashboard' : viewMode === 'demo-upload' ? 'demo-upload' : viewMode === 'roadmap' ? 'roadmap' : activeSection}
        viewMode={viewMode}
        user={user}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        onSignIn={() => setShowSignIn(true)}
        onToggleView={(mode) => {
          if (mode === 'dashboard' && !hasData) {
            handleLoadSample();
          } else {
            setViewMode(mode);
          }
        }}
      />

      <main className="flex-1">
        {viewMode === 'dashboard' ? (
          <Dashboard
            transactions={transactions}
            onUploadNew={() => setViewMode('demo-upload')}
            onLoadSample={handleLoadSample}
          />
        ) : viewMode === 'demo-upload' ? (
          <DemoUpload
            onLaunchDashboard={handleLaunchDashboardFromScan}
          />
        ) : viewMode === 'roadmap' ? (
          <RoadmapSection onLaunchDemo={() => handleNavigate('demo-upload')} />
        ) : (
          <>
            <HeroSection
              onTryLiveDemo={() => setShowSignUp(true)}
              onScrollToFeatures={() => handleNavigate('features')}
            />
            <FeaturesSection />
            <HowItWorksSection />
          </>
        )}
      </main>

      <Footer />

      {showSignUp && (
        <AuthPage asModal initialMode="signup" onClose={() => setShowSignUp(false)} />
      )}

      {showSignIn && (
        <AuthPage asModal initialMode="signin" onClose={() => setShowSignIn(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
