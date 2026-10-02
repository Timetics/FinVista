import { supabase } from '../lib/supabaseClient'
import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Shield,
  Upload, FileText, CheckCircle2, Sparkles, AlertTriangle, AlertCircle,
  Search, Filter, ArrowUpDown, RefreshCw, Send, Bot, User,
  Calendar, PieChart as PieChartIcon, BarChart3, CreditCard, Zap,
  Check, ChevronRight, HelpCircle, ArrowRight, Clock
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import {
  formatCurrency, formatDate, calculateTotals, getCategoryBreakdown,
  getRecurringTransactions, getUnusualTransactions, getHealthScoreLabel,
  simulateAIResponse, calculateHealthScore,
} from '../utils/helpers';
import { monthlyTrendData } from '../data/sampleData';
import {
  categoryColors as configCategoryColors,
  categoryIcons as configCategoryIcons,
  aiInsights,
  chatSuggestions,
  financialHealthMetrics,
  dateRanges,
} from '../constants/uiConfig';

// Derived daily spending data is computed inline below so the chart stays
// fully dynamic and does not depend on the static monthlyTrendData array.

export default function Dashboard({ transactions, onUploadNew, onLoadSample }) {
  const [dateRange, setDateRange] = useState('All'); // '1M', '3M', 'YTD', 'All'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am FinVista AI. I have analyzed your bank statement. Ask me anything about your spending, subscriptions, or investment potential!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const categoryData = useMemo(() => getCategoryBreakdown(transactions), [transactions]);
  const recurringList = useMemo(() => getRecurringTransactions(transactions), [transactions]);
  const unusualList = useMemo(() => getUnusualTransactions(transactions), [transactions]);

  // Dynamic health score derived from actual uploaded data.
  const health = useMemo(() => calculateHealthScore(transactions), [transactions]);

  // Daily spending trend calculated from transaction dates (falls back to monthlyTrendData if empty).
  const dailyTrendData = useMemo(() => {
    if (transactions.length === 0) {
      return monthlyTrendData.map(m => ({ month: m.month, total: m.expenses }));
    }

    const dailyMap = {};
    transactions.forEach(t => {
      if (!t.date || t.type !== 'debit') return;
      const key = t.date;
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, total: 0 };
      }
      dailyMap[key].total += Math.abs(t.amount);
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    if (daily.length === 0) {
      return monthlyTrendData.map(m => ({ month: m.month, total: m.expenses }));
    }
    return daily;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (dateRange === '1M') {
        const d = new Date(t.date);
        const now = new Date();
        const diffDays = (now - d) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      } else if (dateRange === '3M') {
        const d = new Date(t.date);
        const now = new Date();
        const diffDays = (now - d) / (1000 * 3600 * 24);
        if (diffDays > 90) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchAmt = t.amount?.toString().includes(q);
        if (!matchDesc && !matchCat && !matchAmt) return false;
      }

      if (selectedCategory !== 'All' && t.category !== selectedCategory) {
        return false;
      }

      if (flaggedOnly && (t.flags?.length ?? 0) === 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'amount') {
        valA = Math.abs(valA ?? 0);
        valB = Math.abs(valB ?? 0);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, dateRange, searchTerm, selectedCategory, flaggedOnly, sortField, sortDirection]);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsAiTyping(true);

    setTimeout(() => {
      const aiResponseText = simulateAIResponse(query, transactions);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiTyping(false);
    }, 800);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const chartColors = configCategoryColors;

  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-up">

      {/* ==================== A. GLOBAL OVERVIEW & METRICS HEADER ==================== */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Financial Dashboard</h1>
            <p className="text-sm text-slate-400">
              {transactions.length > 0 ? `Statement Analysis as of ${formatDate(new Date().toISOString())}` : 'Statement Analysis'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Date Filter:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              {dateRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateRange === range.value
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Net Balance */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Total Net Balance</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-2">{formatCurrency(totals.netBalance)}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-semibold">+12.4%</span>
              <span className="text-slate-500">vs prev period</span>
            </div>
          </div>

          {/* Income vs Expenses */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Income vs Expenses</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(totals.income)}</span>
              <span className="text-xs text-slate-500">vs</span>
              <span className="text-lg font-bold text-rose-400">{formatCurrency(totals.expenses)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(totals.income / (totals.income + totals.expenses)) * 100}%` }}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${(totals.expenses / (totals.income + totals.expenses)) * 100}%` }}
              />
            </div>
          </div>

          {/* Savings Rate */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Savings Rate</span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Percent className="w-4.5 h-4.5 text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-2">{health.breakdown.savingsRatePercent.toFixed(1)}%</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">Target 20%</span>
              <span className="text-slate-500">• Healthy buffer</span>
            </div>
          </div>

          {/* AI Financial Health Score */}
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">AI Health Score</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-white">{health.score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
              <span
                className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: health.color }}
              >
                {health.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">Dynamic score based on savings rate, expense ratio, and flag density</p>
          </div>
        </div>
      </section>

      {/* ==================== B. STATEMENT IMPORT & PROCESSING ZONE ==================== */}
      <section className="glass-card p-6 border-indigo-500/30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bank Statement Import Zone</h3>
              <p className="text-xs text-slate-400">Drag & drop CSV/PDF statement or test with demo data</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
            <button
              onClick={onLoadSample}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              Reload Demo Statement
            </button>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Mapping Active: {transactions.length} transactions analyzed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== C. VISUALIZATIONS SECTION ==================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown (Pie / Donut) */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-400" />
                Category Expense Breakdown
              </h3>
              <p className="text-xs text-slate-400">Total debit spending by category</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartColors[entry.name] || '#64748b'}
                      stroke="rgba(15, 23, 42, 0.8)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
            {categoryData.slice(0, 6).map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: chartColors[cat.name] || '#64748b' }}
                />
                <span className="text-slate-400 truncate">{cat.name}:</span>
                <span className="font-semibold text-white ml-auto">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Spending Trend (Area Chart) + Monthly Cash Flow Trend (Bar) */}
        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AreaChart className="w-5 h-5 text-emerald-400" />
                  Daily Spending Trend
                </h3>
                <p className="text-xs text-slate-400">Debit spending by date</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <RechartsTooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Debit Spend"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Monthly Cash Flow Trend
                </h3>
                <p className="text-xs text-slate-400">6-month Income vs Expense comparison</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <RechartsTooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800">
              <span>Average Net Margin: <strong className="text-emerald-400">+$3,450/mo</strong></span>
              <span className="text-indigo-400">6 Months Analyzed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== D. AUTOMATED AI AUDITS & ALERTS ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Automated AI Audits & Risk Flags
            </h2>
            <p className="text-xs text-slate-400">Proactive pattern recognition from your latest statement</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Subscriptions */}
          <div className="glass-card p-5 border-l-4 border-l-violet-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                  Recurring Audit
                </span>
                <CreditCard className="w-4 h-4 text-violet-400" />
              </div>
              {recurringList.length > 0 ? (
                <>
                  <h4 className="text-base font-bold text-white mb-2">{recurringList.length} Active Subscriptions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Totaling <strong className="text-white">{formatCurrency(recurringList.reduce((s, r) => s + Math.abs(r.amount), 0))}/month</strong> (~{formatCurrency(recurringList.reduce((s, r) => s + Math.abs(r.amount), 0) * 12)}/year). {recurringList.map(r => r.description).slice(0, 3).join(', ')} detected.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-base font-bold text-white mb-2">Subscriptions: --</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    No recurring subscription charges detected in this statement. Monthly cost: <strong className="text-slate-300">--</strong>
                  </p>
                </>
              )}
            </div>
            <button className="w-full py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-semibold transition-all">
              {recurringList.length > 0 ? `Manage Subscriptions (${formatCurrency(recurringList.reduce((s, r) => s + Math.abs(r.amount), 0) * 12)}/yr)` : 'No Subscriptions Flagged (--)'}
            </button>
          </div>

          {/* Card 2: Unusual Spikes */}
          <div className="glass-card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Spending Spike
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              {unusualList.length > 0 ? (
                <>
                  <h4 className="text-base font-bold text-white mb-2">Spike: {unusualList[0].category}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Unusual large charges at {unusualList.map(u => u.description).slice(0, 2).join(', ')} exceed 3-month baseline.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-base font-bold text-white mb-2">Spending Spikes: --</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    No high-variance or unusual spending spikes detected in this statement. Baseline variance: <strong className="text-slate-300">--</strong>
                  </p>
                </>
              )}
            </div>
            <button className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-all">
              {unusualList.length > 0 ? `Review ${unusualList.length} Flagged Spikes` : 'No Spikes Flagged (--)'}
            </button>
          </div>

          {/* Card 3: Savings Opportunity */}
          <div className="glass-card p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Optimization Tip
                </span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              {(() => {
                const dining = categoryData.find(c => c.name.toLowerCase().includes('dining'));
                if (dining) {
                  return (
                    <>
                      <h4 className="text-base font-bold text-white mb-2">Dining Savings: Save ~{formatCurrency(dining.value * 0.3 * 12)}/yr</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        You spent {formatCurrency(dining.value)} on dining. A 30% reduction redirects {formatCurrency(dining.value * 0.3)}/month directly into savings.
                      </p>
                    </>
                  );
                } else if (categoryData.length > 0) {
                  const topCat = categoryData[0];
                  return (
                    <>
                      <h4 className="text-base font-bold text-white mb-2">{topCat.name}: {formatCurrency(topCat.value)}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Dining expense: <strong className="text-slate-300">--</strong>. Primary debit concentration is in <strong>{topCat.name}</strong> ({formatCurrency(topCat.value)}).
                      </p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <h4 className="text-base font-bold text-white mb-2">Dining Savings: --</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Dining expense: <strong className="text-slate-300">--</strong>. No expense data present in this statement.
                      </p>
                    </>
                  );
                }
              })()}
            </div>
            <button className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-all">
              {categoryData.some(c => c.name.toLowerCase().includes('dining')) ? 'Apply AI Savings Plan' : 'View Category Breakdown'}
            </button>
          </div>
        </div>
      </section>

      {/* ==================== E. INTERACTIVE AI FINANCIAL ASSISTANT (CHAT) ==================== */}
      <section className="glass-card p-6 border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                FinVista AI Financial Assistant
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  Gemini-Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400">Ask natural language questions about your statement</p>
            </div>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {chatSuggestions.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {chip}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="h-72 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 mb-4">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className="text-[10px] opacity-60 text-right mt-1.5">{msg.timestamp}</div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {isAiTyping && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 italic">
              <Bot className="w-4 h-4 animate-spin" />
              FinVista AI is typing response...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI anything (e.g. 'Can I afford a $500 flight?')..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendMessage()}
            className="btn-primary !py-2.5 !px-5 flex items-center gap-2 text-xs"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ==================== F. CATEGORIZED TRANSACTION LEDGER ==================== */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Categorized Transaction Ledger
            </h2>
            <p className="text-xs text-slate-400">Search, filter, and audit mapped statement entries</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {Object.keys(configCategoryColors).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setFlaggedOnly(!flaggedOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                flaggedOnly
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Flagged Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end gap-1">
                    Amount <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status / Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="py-3 px-4 font-medium text-white">{t.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block"
                        style={{
                          backgroundColor: `${configCategoryColors[t.category] || '#64748b'}20`,
                          color: configCategoryColors[t.category] || '#cbd5e1',
                          border: `1px solid ${configCategoryColors[t.category] || '#64748b'}40`
                        }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.type === 'credit' ? '+' : ''}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(t.flags?.length ?? 0) > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {t.flags.map((flag, fi) => (
                            <span
                              key={fi}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                flag === 'Recurring'
                                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600">Clean</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Showing {filteredTransactions.length} of {transactions.length} total entries</span>
          <span>FinVista AI Data Engine v1.0</span>
        </div>
      </section>

    </div>
  );
}
