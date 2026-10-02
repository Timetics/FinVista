import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Clock, Lock, ArrowRight,
  Upload, Brain, PieChart, AlertTriangle,
  MessageSquare, Shield, CreditCard, Wallet,
  Target, Users, Globe, Zap, BarChart3,
  FileText, Settings, Bell, Smartphone,
  Key, Database, Layers, GitBranch,
  TrendingUp, DollarSign, Calendar,
  Star, Rocket, Flag, Sparkles
} from 'lucide-react';

const phases = [
  {
    id: 'phase-1',
    phase: 'Phase 1',
    title: 'Foundation & Core Dashboard',
    status: 'current',
    timeline: 'Weeks 1–3',
    description: 'Core app structure, statement processing, and basic visualizations.',
    color: 'indigo',
    components: [
      {
        name: 'App Shell & Navigation',
        icon: Layers,
        status: 'done',
        details: 'Responsive layout, dark theme, Navbar with mobile menu, smooth scroll navigation, glassmorphism design system.',
      },
      {
        name: 'Hero Landing Page',
        icon: Rocket,
        status: 'done',
        details: 'Animated hero section, interactive dashboard preview, floating notification cards, particle effects, stats bar.',
      },
      {
        name: 'Statement Import & Dropzone',
        icon: Upload,
        status: 'planned',
        details: 'Drag & drop file zone supporting CSV/PDF. File validation, progress indicator, parse status ("AI Parsing... 142 transactions mapped"). Demo mode with sample data loader.',
      },
      {
        name: 'CSV/PDF Parser Engine',
        icon: FileText,
        status: 'planned',
        details: 'Client-side CSV parsing (Papa Parse). PDF text extraction (pdf.js). Column auto-detection for Date, Description, Amount. Multi-bank format support.',
      },
      {
        name: 'Transaction Data Store',
        icon: Database,
        status: 'planned',
        details: 'React context/state for global transaction data. Computed values: totals, categories, date ranges. LocalStorage persistence for session continuity.',
      },
      {
        name: 'Summary Metrics Cards',
        icon: BarChart3,
        status: 'planned',
        details: 'Net Balance (with % change vs previous period). Total Income vs Expenses. Savings Rate percentage. AI Health Score (0–100 dynamic badge). Animated counters & sparkline previews.',
      },
    ],
  },
  {
    id: 'phase-2',
    phase: 'Phase 2',
    title: 'Data Visualizations & Analytics',
    status: 'upcoming',
    timeline: 'Weeks 4–6',
    description: 'Rich, interactive charts and filterable data views.',
    color: 'violet',
    components: [
      {
        name: 'Category Donut Chart',
        icon: PieChart,
        status: 'planned',
        details: 'Recharts PieChart with custom active shape. Color-coded by category (Housing=indigo, Dining=amber, etc.). Hover tooltips with amount & percentage. Center label showing total.',
      },
      {
        name: 'Monthly Trend Chart',
        icon: TrendingUp,
        status: 'planned',
        details: 'Stacked Bar or Area chart comparing Income vs Expenses over 6+ months. Custom tooltip with formatted values. Grid lines and axis styling matching dark theme.',
      },
      {
        name: 'Date Range Filter',
        icon: Calendar,
        status: 'planned',
        details: 'Filter buttons: 1 Month, 3 Months, YTD, All. Dynamic chart data recalculation. Animated transitions between date ranges. Custom date picker for precise ranges.',
      },
      {
        name: 'Spending Heatmap',
        icon: Target,
        status: 'planned',
        details: 'Daily spending intensity visualization. Color gradient from green (low) to red (high). Hover details for each day. Weekly/monthly aggregation toggle.',
      },
      {
        name: 'Cash Flow Waterfall',
        icon: DollarSign,
        status: 'planned',
        details: 'Waterfall chart showing income → categories → net balance flow. Running total visualization. Positive (green) and negative (red) segments.',
      },
      {
        name: 'Comparison Analytics',
        icon: GitBranch,
        status: 'planned',
        details: 'Month-over-month comparison view. Category variance analysis (% change). Best/worst spending months. Average computation and trend lines.',
      },
    ],
  },
  {
    id: 'phase-3',
    phase: 'Phase 3',
    title: 'AI Engine & Smart Alerts',
    status: 'upcoming',
    timeline: 'Weeks 7–9',
    description: 'Automated auditing, anomaly detection, and proactive insights.',
    color: 'amber',
    components: [
      {
        name: 'AI Categorization Engine',
        icon: Brain,
        status: 'planned',
        details: 'Rule-based + ML categorization. Merchant name recognition database. Custom category creation & training. Confidence scoring per transaction.',
      },
      {
        name: 'Subscription Detector',
        icon: CreditCard,
        status: 'planned',
        details: 'Pattern recognition for recurring charges (same amount, ~30-day interval). Subscription list with monthly/yearly cost projections. Cancellation suggestion ranking by value.',
      },
      {
        name: 'Anomaly Detection',
        icon: AlertTriangle,
        status: 'planned',
        details: 'Statistical deviation analysis per category. Z-score flagging for unusual transactions. Historical baseline comparison. Configurable sensitivity thresholds.',
      },
      {
        name: 'Smart Alert Cards',
        icon: Bell,
        status: 'planned',
        details: 'Severity-coded insight cards (success/warning/alert/tip). Actionable recommendations with quick-action buttons. Expandable detail views. Dismissible with "noted" tracking.',
      },
      {
        name: 'Financial Health Score',
        icon: Star,
        status: 'planned',
        details: 'Composite score (0–100) from: savings rate, debt ratio, emergency fund, spending consistency. Breakdown visualization with sub-scores. Status badges: Excellent/Good/Fair/Needs Attention.',
      },
      {
        name: 'Savings Optimizer',
        icon: Wallet,
        status: 'planned',
        details: 'AI-generated savings recommendations. "What if" scenario modeling. Projected annual savings from suggested changes. Priority-ranked action items.',
      },
    ],
  },
  {
    id: 'phase-4',
    phase: 'Phase 4',
    title: 'Interactive AI Assistant',
    status: 'upcoming',
    timeline: 'Weeks 10–12',
    description: 'Natural language financial advisor powered by Gemini API.',
    color: 'emerald',
    components: [
      {
        name: 'Chat Interface',
        icon: MessageSquare,
        status: 'planned',
        details: 'Embedded chat panel with message bubbles. Markdown rendering for AI responses. Auto-scroll, typing indicator, timestamp display. Collapsible/resizable panel.',
      },
      {
        name: 'Pre-set Prompt Chips',
        icon: Sparkles,
        status: 'planned',
        details: 'Quick-query buttons: "Where am I spending most?", "Find cancelable subscriptions", "How much can I invest?", "Budget plan for next month". Context-aware chip suggestions.',
      },
      {
        name: 'Gemini API Integration',
        icon: Key,
        status: 'planned',
        details: 'Gemini API connection with streaming responses. Transaction data context injection. Conversation memory within session. Rate limiting and error handling.',
      },
      {
        name: 'Data-Aware Responses',
        icon: Database,
        status: 'planned',
        details: 'AI responses reference actual loaded statement data. Dynamic calculation of totals, averages, comparisons. Table and chart embedding in responses. Source transaction citations.',
      },
      {
        name: 'Budget Planner Mode',
        icon: Target,
        status: 'planned',
        details: 'Interactive budget creation wizard. Category-by-category allocation. Comparison against actual spending. Exportable budget plan document.',
      },
      {
        name: 'Export & Share',
        icon: FileText,
        status: 'planned',
        details: 'Export insights as PDF report. CSV export of categorized transactions. Shareable summary links (anonymized). Print-optimized layout.',
      },
    ],
  },
  {
    id: 'phase-5',
    phase: 'Phase 5',
    title: 'Transaction Ledger & Advanced Features',
    status: 'upcoming',
    timeline: 'Weeks 13–16',
    description: 'Full transaction management, multi-account, and mobile experience.',
    color: 'cyan',
    components: [
      {
        name: 'Transaction Table',
        icon: FileText,
        status: 'planned',
        details: 'Searchable, sortable, paginated table. Columns: Date, Description, Category (color badge), Amount (green/red), Flags. Inline category re-assignment. Bulk actions.',
      },
      {
        name: 'Advanced Filters',
        icon: Settings,
        status: 'planned',
        details: 'Multi-filter panel: keyword search, category checkboxes, date range, amount range, flag filter (Recurring/Unusual only). Saved filter presets.',
      },
      {
        name: 'Multi-Account Support',
        icon: Users,
        status: 'planned',
        details: 'Import statements from multiple bank accounts. Account selector with color coding. Consolidated vs. per-account views. Cross-account analytics.',
      },
      {
        name: 'Mobile Responsive Polish',
        icon: Smartphone,
        status: 'planned',
        details: 'Touch-optimized interactions. Bottom sheet navigation on mobile. Swipe gestures for transaction actions. PWA manifest for home screen install.',
      },
      {
        name: 'Goal Tracking',
        icon: Flag,
        status: 'planned',
        details: 'Set savings goals with target amounts and dates. Progress bar visualization. AI-powered goal feasibility analysis. Milestone celebrations.',
      },
      {
        name: 'Data Privacy Controls',
        icon: Shield,
        status: 'planned',
        details: 'One-click data wipe. Session-only mode (no persistence). Encrypted local storage option. Privacy audit log.',
      },
    ],
  },
];

const statusConfig = {
  done: { icon: CheckCircle2, label: 'Complete', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  current: { icon: Zap, label: 'In Progress', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  planned: { icon: Clock, label: 'Planned', color: 'text-slate-500', bg: 'bg-slate-800/50', border: 'border-slate-700/50' },
  upcoming: { icon: Clock, label: 'Upcoming', color: 'text-slate-500', bg: 'bg-slate-800/50', border: 'border-slate-700/50' },
};

const phaseColors = {
  indigo: { gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  violet: { gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-500' },
  amber: { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  cyan: { gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-500' },
};

export default function RoadmapSection({ onLaunchDemo }) {
  const [expandedPhase, setExpandedPhase] = useState('phase-1');
  const [expandedComponent, setExpandedComponent] = useState(null);
  const [visiblePhases, setVisiblePhases] = useState(new Set());
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = entry.target.dataset.phase;
            setVisiblePhases(prev => new Set([...prev, idx]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = sectionRef.current?.querySelectorAll('[data-phase]');
    items?.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const totalComponents = phases.reduce((sum, p) => sum + p.components.length, 0);
  const doneComponents = phases.reduce(
    (sum, p) => sum + p.components.filter(c => c.status === 'done').length, 0
  );

  return (
    <section id="roadmap" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/98 to-slate-950" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Flag className="w-4 h-4" />
            <span>Project Roadmap</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            Building the future of{' '}
            <span className="gradient-text">personal finance</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            A detailed component map of every feature being built. Each phase includes
            specific components with implementation details.
          </p>

          {/* Progress bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-indigo-400 font-medium">{doneComponents}/{totalComponents} components</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                style={{ width: `${(doneComponents / totalComponents) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {phases.map((phase, pi) => {
            const colors = phaseColors[phase.color];
            const status = statusConfig[phase.status];
            const isExpanded = expandedPhase === phase.id;
            const doneInPhase = phase.components.filter(c => c.status === 'done').length;

            return (
              <div
                key={phase.id}
                data-phase={phase.id}
                className={`transition-all duration-700 ${visiblePhases.has(phase.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                style={{ transitionDelay: `${pi * 100}ms` }}
              >
                {/* Phase header */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  className={`w-full glass-card p-6 flex items-center gap-6 text-left transition-all duration-300 ${isExpanded ? `!border-${phase.color === 'indigo' ? 'indigo' : phase.color}-500/40` : ''
                    }`}
                >
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-sm">{phase.phase.split(' ')[1]}</span>
                    </div>
                    {pi < phases.length - 1 && (
                      <div className="w-px h-4 bg-slate-800" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        {phase.phase}
                      </span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{phase.timeline}</span>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} border ${status.border}`}>
                        <status.icon className={`w-3 h-3 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{phase.title}</h3>
                    <p className="text-sm text-slate-400">{phase.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-slate-500">{phase.components.length} components</span>
                      <div className="flex-1 max-w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
                          style={{ width: `${(doneInPhase / phase.components.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{doneInPhase}/{phase.components.length}</span>
                    </div>
                  </div>

                  <ArrowRight className={`w-5 h-5 text-slate-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-90' : ''
                    }`} />
                </button>

                {/* Expanded components */}
                <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-0 sm:pl-18">
                    {phase.components.map((comp, ci) => {
                      const compStatus = statusConfig[comp.status];
                      const isCompExpanded = expandedComponent === `${phase.id}-${ci}`;

                      return (
                        <div
                          key={ci}
                          className={`glass-card-subtle p-5 cursor-pointer transition-all duration-300 hover:bg-slate-800/40 ${isCompExpanded ? 'ring-1 ring-indigo-500/30' : ''
                            }`}
                          onClick={() => setExpandedComponent(
                            isCompExpanded ? null : `${phase.id}-${ci}`
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-9 h-9 rounded-lg ${compStatus.bg} border ${compStatus.border} flex items-center justify-center`}>
                              <comp.icon className={`w-4 h-4 ${compStatus.color}`} />
                            </div>
                            <compStatus.icon className={`w-4 h-4 ${compStatus.color}`} />
                          </div>

                          <h4 className="text-sm font-semibold text-white mb-2">{comp.name}</h4>

                          <p className={`text-xs text-slate-400 leading-relaxed transition-all duration-300 ${isCompExpanded ? '' : 'line-clamp-2'
                            }`}>
                            {comp.details}
                          </p>

                          {!isCompExpanded && comp.details.length > 100 && (
                            <span className={`text-xs ${colors.text} mt-2 inline-block`}>
                              Click to expand →
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card inline-flex flex-col sm:flex-row items-center gap-6 p-8">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-white mb-2">Ready to get started?</h3>
              <p className="text-sm text-slate-400">Try the live demo with sample data — no sign-up required.</p>
            </div>
            <button onClick={onLaunchDemo} className="btn-primary !px-8 !py-3 flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              Launch Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
