import { useState, useEffect, useRef } from 'react';
import {
  FileText, Sparkles, ArrowRight, Play,
  TrendingUp, Shield, Brain, BarChart3, Zap,
  ChevronRight, CheckCircle2, ArrowDown, Star,
  Lock, Globe, Layers, MessageSquare, PieChart,
  AlertTriangle, CreditCard, Wallet, Target,
  Clock, Users, Award, Rocket
} from 'lucide-react';

export default function HeroSection({ onScrollToFeatures, onTryLiveDemo }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [particlePositions, setParticlePositions] = useState([]);

  useEffect(() => {
    setIsVisible(true);
    // Generate random particle positions on mount
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4,
    }));
    setParticlePositions(particles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Brain, label: 'AI-Powered Analysis', desc: 'Smart categorization' },
    { icon: PieChart, label: 'Visual Analytics', desc: 'Interactive charts' },
    { icon: AlertTriangle, label: 'Smart Alerts', desc: 'Risk detection' },
    { icon: MessageSquare, label: 'AI Assistant', desc: 'Financial guidance' },
  ];

  const stats = [
    { value: '10K+', label: 'Transactions Analyzed', icon: BarChart3 },
    { value: '99.2%', label: 'Categorization Accuracy', icon: Target },
    { value: '< 3s', label: 'Processing Time', icon: Zap },
    { value: '256-bit', label: 'Encryption', icon: Shield },
  ];

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 radial-gradient" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particlePositions.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-indigo-500/20 animate-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <div className={`space-y-8 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Financial Intelligence</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                <span className="text-white">Transform Your</span>
                <br />
                <span className="gradient-text">Bank Statements</span>
                <br />
                <span className="text-white">Into Insights</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed">
                Upload your bank statements and let AI automatically categorize transactions,
                visualize spending patterns, flag financial risks, and guide your financial decisions.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onTryLiveDemo}
                className="btn-primary !px-8 !py-4 !text-base flex items-center justify-center gap-3 group"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Try Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>No data stored</span>
              </div>
            </div>
          </div>

          {/* Right - Interactive Dashboard Preview */}
          <div className={`relative ${isVisible ? 'animate-slide-right' : 'opacity-0'}`}>
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

              {/* Main card */}
              <div className="relative glass-card p-6 lg:p-8 space-y-6">
                {/* Mini header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Financial Overview</p>
                      <p className="text-xs text-slate-500">September 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Live</span>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-1">Net Balance</p>
                  <p className="text-4xl font-bold text-white">$3,377.55</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +12.4%
                    </span>
                    <span className="text-slate-600 text-sm">vs last month</span>
                  </div>
                </div>

                {/* Mini chart bars */}
                <div className="flex items-end justify-center gap-2 h-20">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68].map((h, i) => (
                    <div
                      key={i}
                      className="w-3 rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        background: i === 6
                          ? 'linear-gradient(to top, #6366f1, #8b5cf6)'
                          : 'rgba(99, 102, 241, 0.2)',
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Income</p>
                    <p className="text-sm font-semibold text-emerald-400">$16,327</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Expenses</p>
                    <p className="text-sm font-semibold text-rose-400">$12,950</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Savings</p>
                    <p className="text-sm font-semibold text-indigo-400">20.7%</p>
                  </div>
                </div>

                {/* Feature rotating bar */}
                <div className="flex gap-2 pt-2">
                  {features.map((f, i) => (
                    <div
                      key={i}
                      className={`flex-1 p-3 rounded-xl transition-all duration-500 cursor-pointer ${activeFeature === i
                        ? 'bg-indigo-500/15 border border-indigo-500/30'
                        : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50'
                        }`}
                      onClick={() => setActiveFeature(i)}
                    >
                      <f.icon className={`w-4 h-4 mb-1.5 ${activeFeature === i ? 'text-indigo-400' : 'text-slate-500'
                        }`} />
                      <p className={`text-[10px] font-medium leading-tight ${activeFeature === i ? 'text-indigo-300' : 'text-slate-500'
                        }`}>
                        {f.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating notification cards */}
              <div className="absolute -left-8 top-20 animate-float glass-card-subtle !bg-slate-900/90 px-4 py-3 flex items-center gap-3 shadow-xl hidden lg:flex" style={{ animationDelay: '1s' }}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">142 Transactions</p>
                  <p className="text-[10px] text-slate-500">Auto-categorized</p>
                </div>
              </div>

              <div className="absolute -right-6 bottom-32 animate-float glass-card-subtle !bg-slate-900/90 px-4 py-3 flex items-center gap-3 shadow-xl hidden lg:flex" style={{ animationDelay: '2.5s' }}>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Spending Alert</p>
                  <p className="text-[10px] text-slate-500">Shopping +47%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 ${isVisible ? 'animate-fade-up stagger-5' : 'opacity-0'}`}>
          {stats.map((stat, i) => (
            <div key={i} className="glass-card-subtle p-5 text-center group hover:bg-slate-800/40 transition-all">
              <stat.icon className="w-5 h-5 text-indigo-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-slate-600">Scroll to explore</span>
        <ArrowDown className="w-4 h-4 text-slate-600" />
      </div>
    </section>
  );
}
