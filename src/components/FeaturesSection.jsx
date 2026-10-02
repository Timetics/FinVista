import { useState, useEffect, useRef } from 'react';
import {
  Brain, PieChart, AlertTriangle, MessageSquare,
  Upload, Shield, Zap, TrendingUp, BarChart3,
  CreditCard, Target, Eye, Lock, Layers,
  ArrowRight, CheckCircle2, Sparkles, FileText,
  RefreshCw, Search, Filter
} from 'lucide-react';

const featureCards = [
  {
    icon: Upload,
    title: 'Smart Statement Import',
    description: 'Drag & drop CSV or PDF bank statements. Our AI instantly parses and structures your financial data with 99.2% accuracy.',
    color: 'indigo',
    details: ['CSV & PDF support', 'Multi-bank compatible', 'Instant processing', 'Smart field detection'],
  },
  {
    icon: Brain,
    title: 'AI Auto-Categorization',
    description: 'Machine learning automatically categorizes every transaction into smart spending groups — no manual work needed.',
    color: 'violet',
    details: ['15+ categories', 'Custom rules', 'Learning algorithm', 'Merchant recognition'],
  },
  {
    icon: PieChart,
    title: 'Interactive Visualizations',
    description: 'Beautiful, interactive charts reveal your spending patterns. Donut charts, trend lines, and breakdowns you can filter and explore.',
    color: 'cyan',
    details: ['Category breakdown', 'Monthly trends', 'Income vs expenses', 'Date range filters'],
  },
  {
    icon: AlertTriangle,
    title: 'Smart Risk Alerts',
    description: 'AI proactively flags unusual spending spikes, hidden subscriptions, and cash flow risks before they become problems.',
    color: 'amber',
    details: ['Spending anomalies', 'Subscription tracker', 'Cash flow warnings', 'Severity levels'],
  },
  {
    icon: MessageSquare,
    title: 'AI Financial Assistant',
    description: 'Ask natural language questions about your finances. Get instant, data-backed answers and personalized recommendations.',
    color: 'emerald',
    details: ['Natural language Q&A', 'Budget planning', 'Investment advice', 'Spending analysis'],
  },
  {
    icon: Shield,
    title: 'Privacy & Security First',
    description: 'Your data never leaves your browser. Zero server uploads, bank-level encryption, and complete local processing.',
    color: 'rose',
    details: ['Client-side only', '256-bit encryption', 'No data stored', 'Open-source audit'],
  },
];

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/10',
    dot: 'bg-indigo-400',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    glow: 'group-hover:shadow-violet-500/10',
    dot: 'bg-violet-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/10',
    dot: 'bg-cyan-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/10',
    dot: 'bg-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'group-hover:shadow-rose-500/10',
    dot: 'bg-rose-400',
  },
};

export default function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index);
            setVisibleCards(prev => new Set([...prev, idx]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('[data-index]');
    cards?.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Layers className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            Everything you need to{' '}
            <span className="gradient-text">master your finances</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            From automatic transaction categorization to AI-powered insights, 
            FinVista AI gives you complete visibility into your financial health.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feature, i) => {
            const colors = colorClasses[feature.color];
            return (
              <div
                key={i}
                data-index={i}
                className={`group glass-card p-6 lg:p-8 transition-all duration-700 ${
                  visibleCards.has(i) 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                } ${colors.glow} hover:shadow-xl`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">{feature.description}</p>

                {/* Detail list */}
                <div className="space-y-2.5">
                  {feature.details.map((detail, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span className="text-sm text-slate-500">{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Hover arrow */}
                <div className={`mt-6 flex items-center gap-2 ${colors.text} text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1`}>
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
