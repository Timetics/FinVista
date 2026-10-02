import { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Brain, BarChart3,
  CheckCircle2, ArrowRight, Sparkles, Zap,
  Search, PieChart, MessageSquare
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Statement',
    description: 'Drag & drop your CSV or PDF bank statement into the secure upload zone. Your data stays entirely in your browser.',
    color: 'indigo',
    visual: 'upload',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our AI engine instantly parses, categorizes, and analyzes every transaction. Recurring charges and anomalies are automatically flagged.',
    color: 'violet',
    visual: 'analyze',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Explore Insights',
    description: 'Interactive charts reveal spending patterns, income trends, and savings opportunities. Filter by date, category, or flags.',
    color: 'cyan',
    visual: 'charts',
  },
  {
    number: '04',
    icon: MessageSquare,
    title: 'Get AI Guidance',
    description: 'Ask the AI assistant questions about your finances. Get personalized budget plans, investment recommendations, and savings tips.',
    color: 'emerald',
    visual: 'chat',
  },
];

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    line: 'from-indigo-500',
    glow: 'bg-indigo-500/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    line: 'from-violet-500',
    glow: 'bg-violet-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    line: 'from-cyan-500',
    glow: 'bg-cyan-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    line: 'from-emerald-500',
    glow: 'bg-emerald-500/20',
  },
};

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(new Set());
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.step);
            setVisibleSteps(prev => new Set([...prev, idx]));
          }
        });
      },
      { threshold: 0.3 }
    );

    const items = sectionRef.current?.querySelectorAll('[data-step]');
    items?.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const StepVisual = ({ type }) => {
    switch (type) {
      case 'upload':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Drop bank_statement.csv</p>
              <p className="text-xs text-slate-600 mt-1">or click to browse</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
              <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs text-indigo-400 font-medium">Upload a file</p>
                <p className="text-[10px] text-slate-500">CSV or PDF statement</p>
              </div>
            </div>
          </div>
        );
      case 'analyze':
        return (
          <div className="space-y-3">
            {['Housing — Rent Payment', 'Dining — Starbucks Coffee', 'Subscriptions — Netflix'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg" style={{ animationDelay: `${i * 0.3}s` }}>
                <div className="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">{item.split(' — ')[0]}</p>
                  <p className="text-[10px] text-slate-500">{item.split(' — ')[1]}</p>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            ))}
          </div>
        );
      case 'charts':
        return (
          <div className="space-y-3">
            <div className="flex items-end gap-1.5 h-16 px-2">
              {[35, 55, 40, 70, 50, 65, 85, 45, 60, 75, 55, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/30 to-cyan-500/80 transition-all duration-700"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 px-2">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg rounded-bl-sm">
              <p className="text-xs text-slate-400">Where am I spending the most?</p>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg rounded-br-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-indigo-400 font-medium">FinVista AI</span>
              </div>
              <p className="text-xs text-slate-300">Housing is your largest expense at $2,100 (16.2% of spending)...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-950/98" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Simple Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            From statement to insights{' '}
            <span className="gradient-text">in seconds</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Four simple steps to transform raw bank data into actionable financial intelligence.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
          {steps.map((step, i) => {
            const colors = colorMap[step.color];
            return (
              <div
                key={i}
                data-step={i}
                className={`relative transition-all duration-700 ${visibleSteps.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px">
                    <div className={`h-px bg-gradient-to-r ${colors.line} to-transparent opacity-30`} />
                  </div>
                )}

                <div
                  className={`glass-card h-full flex flex-col p-6 cursor-pointer transition-all duration-300 ${activeStep === i ? `border-${step.color === 'indigo' ? 'indigo' : step.color === 'violet' ? 'violet' : step.color === 'cyan' ? 'cyan' : 'emerald'}-500/40` : ''
                    }`}
                  onClick={() => setActiveStep(i)}
                >
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className={`text-3xl font-extrabold ${colors.text} opacity-20`}>{step.number}</span>
                  </div>

                  <h3 className="min-h-12 text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5 lg:min-h-[7.5rem]">{step.description}</p>

                  {/* Visual */}
                  <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border} transition-all duration-500 ${activeStep === i ? 'opacity-100' : 'opacity-60'
                    }`}>
                    <StepVisual type={step.visual} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
