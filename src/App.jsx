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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signOut } from './lib/supabaseAuth';

function AppContent() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('hero');
  const [viewMode, setViewMode] = useState('homepage'); // 'homepage' | 'roadmap' | 'dashboard' | 'demo-upload'
  const [hasData, setHasData] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  // Close auth modals once the user is authenticated
  useEffect(() => {
    if (user) {
      setShowSignIn(false);
      setShowSignUp(false);
    }
  }, [user]);

  // Load any previously saved transactions from Supabase on mount
  useEffect(() => {
    if (!user) return;
    loadTransactions(user.id).then((saved) => {
      if (saved.length > 0) {
        setTransactions(saved);
        setHasData(true);
      }
    });
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
        setTransactions(sampleTransactions);
        setHasData(true);
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
  }, [hasData, user?.id]);

  const handleLoadSample = useCallback(() => {
    setTransactions(sampleTransactions);
    setHasData(true);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveTransactions(sampleTransactions, user?.id).catch((err) =>
      console.error('[supabase] sample save failed:', err)
    );
  }, [user?.id]);

  const handleLaunchDashboardFromScan = useCallback(async (scannedTransactions) => {
    setTransactions(scannedTransactions);
    setHasData(true);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveTransactions(scannedTransactions, user?.id).catch((err) =>
      console.error('[supabase] scan save failed:', err)
    );
  }, [user?.id]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[auth] sign-out failed:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar
        hasData={hasData}
        onNavigate={handleNavigate}
        activeSection={viewMode === 'dashboard' ? 'dashboard' : viewMode === 'demo-upload' ? 'demo-upload' : viewMode === 'roadmap' ? 'roadmap' : activeSection}
        viewMode={viewMode}
        user={user}
        onSignOut={handleSignOut}
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
