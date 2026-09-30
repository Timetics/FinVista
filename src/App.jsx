import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import RoadmapSection from './components/RoadmapSection';
import Dashboard from './components/Dashboard';
import DemoUpload from './components/DemoUpload';
import Footer from './components/Footer';
import { sampleTransactions } from './data/sampleData';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [viewMode, setViewMode] = useState('homepage'); // 'homepage' | 'dashboard' | 'demo-upload'
  const [hasData, setHasData] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Track active section on scroll if in homepage mode
  useEffect(() => {
    if (viewMode !== 'homepage') return;

    const handleScroll = () => {
      const sections = ['hero', 'features', 'how-it-works', 'roadmap'];
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

    if (sectionId === 'dashboard') {
      if (!hasData) {
        setTransactions(sampleTransactions);
        setHasData(true);
      }
      setViewMode('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'hero' || sectionId === 'features' || sectionId === 'how-it-works' || sectionId === 'roadmap') {
      setViewMode('homepage');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [hasData]);

  const handleLoadSample = useCallback(() => {
    setTransactions(sampleTransactions);
    setHasData(true);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLaunchDashboardFromScan = useCallback((scannedTransactions) => {
    setTransactions(scannedTransactions);
    setHasData(true);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar 
        hasData={hasData} 
        onNavigate={handleNavigate} 
        activeSection={viewMode === 'dashboard' ? 'dashboard' : viewMode === 'demo-upload' ? 'demo-upload' : activeSection} 
        viewMode={viewMode}
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
        ) : (
          <>
            <HeroSection 
              onLoadSample={handleLoadSample} 
              onScrollToFeatures={() => handleNavigate('features')} 
            />
            <FeaturesSection />
            <HowItWorksSection />
            <RoadmapSection />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

