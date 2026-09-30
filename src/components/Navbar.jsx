import { useState, useEffect } from 'react';
import { 
  TrendingUp, Menu, X, Bell, Search, 
  Sparkles, LayoutDashboard, Home, Scan
} from 'lucide-react';

export default function Navbar({ hasData, onNavigate, activeSection, viewMode, onToggleView }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'demo-upload', label: 'Demo Upload' },
    { id: 'roadmap', label: 'Roadmap' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate?.('hero')}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white tracking-tight">FinVista</span>
              <span className="text-lg font-bold gradient-text">AI</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate?.(link.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === link.id
                    ? 'text-white bg-slate-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right side View Switcher & Action Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => onToggleView?.('homepage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'homepage'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
              <button
                onClick={() => onNavigate?.('demo-upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'demo-upload'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scan className="w-3.5 h-3.5" />
                Demo Upload
              </button>
              <button
                onClick={() => onToggleView?.('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </div>

            <button
              onClick={() => onNavigate?.('dashboard')}
              className="btn-primary !px-4 !py-2 !text-xs flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{viewMode === 'dashboard' ? 'AI Advisor' : 'Launch Dashboard'}</span>
            </button>

            {/* Mobile toggle */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 pb-4 pt-2 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => { onNavigate?.(link.id); setMobileOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeSection === link.id
                  ? 'text-white bg-slate-800/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button 
            onClick={() => { onNavigate?.('dashboard'); setMobileOpen(false); }}
            className="btn-primary w-full !py-3 !text-sm flex items-center justify-center gap-2 mt-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Open Live Dashboard
          </button>
        </div>
      </div>
    </nav>
  );
}
