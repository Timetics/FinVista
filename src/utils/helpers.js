// Utility functions for data processing and formatting
import { HEALTH_SCORE_CONFIG } from '../constants/healthConfig';

export const formatCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(absAmount);
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Aggregate credit/debit totals for a transaction list.
 * @param {Array} transactions
 * @returns {Object} { income, expenses, netBalance, savingsRate }
 */
export const calculateTotals = (transactions = []) => {
  const income = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const expenses = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const netBalance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  return {
    income,
    expenses,
    netBalance,
    savingsRate,
  };
};

/**
 * Aggregate debit spending by category, sorted by value descending.
 * @param {Array} transactions
 * @returns {Array<{name: string, value: number}>}
 */
export const getCategoryBreakdown = (transactions = []) => {
  const map = new Map();
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const name = t.category || 'Uncategorized';
      map.set(name, (map.get(name) || 0) + Math.abs(Number(t.amount) || 0));
    });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Return transactions flagged as Recurring.
 * @param {Array} transactions
 */
export const getRecurringTransactions = (transactions = []) =>
  transactions.filter(t => t.flags?.includes('Recurring'));

/**
 * Return transactions flagged as Unusual.
 * @param {Array} transactions
 */
export const getUnusualTransactions = (transactions = []) =>
  transactions.filter(t => t.flags?.includes('Unusual'));

/**
 * Map a numeric health score to a label/color pair.
 * @param {number} score
 * @returns {{label: string, color: string}}
 */
export const getHealthScoreLabel = (score) => {
  if (score >= 90) return { label: 'Excellent', color: '#10b981' };
  if (score >= 75) return { label: 'Good', color: '#22d3ee' };
  if (score >= 60) return { label: 'Fair', color: '#f59e0b' };
  if (score >= 40) return { label: 'Needs Attention', color: '#f97316' };
  return { label: 'Critical', color: '#f43f5e' };
};

/**
 * Calculate health score (0-100) from a transaction list.
 * @param {Array} transactions - Transactions with { type, amount, flags }.
 * @returns {Object} { score, label, color, breakdown }
 */
export const calculateHealthScore = (transactions = []) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      score: 0,
      label: 'Critical',
      color: '#f43f5e',
      breakdown: {
        savingsRate: 0,
        expenseToIncome: 0,
        flagDensity: 0,
        income: 0,
        expenses: 0,
        netBalance: 0,
        savingsRatePercent: 0,
      },
    };
  }

  const { savingsRate, expenseToIncome, flagDensity } = HEALTH_SCORE_CONFIG;

  const totals = calculateTotals(transactions);
  const income = totals.income || 0;
  const expenses = totals.expenses || 0;

  // 1) Savings-rate sub-score (0-100)
  let savingsSub = 0;
  if (income > 0) {
    const ratio = (income - expenses) / income;
    if (ratio >= 0.2) savingsSub = 100;
    else if (ratio >= 0.1) savingsSub = 75;
    else if (ratio >= 0.05) savingsSub = 50;
    else if (ratio >= 0) savingsSub = 25;
  }

  // 2) Expense-to-income sub-score (0-100). Lower expenses => higher score.
  let expenseSub = 50; // neutral when no income
  if (income > 0) {
    const ratio = expenses / income;
    if (ratio <= expenseToIncome.healthyMax) expenseSub = 100;
    else if (ratio <= expenseToIncome.warningMax) expenseSub = 70;
    else if (ratio <= 1) expenseSub = 45;
    else expenseSub = 20;
  }

  // 3) Flag-density sub-score. Fewer flags => higher score.
  let flagSub = 100;
  const recurring = transactions.filter(t => t.flags?.includes('Recurring')).length;
  const unusual = transactions.filter(t => t.flags?.includes('Unusual')).length;
  const flagged = transactions.filter(t => t.flags && t.flags.length > 0).length;
  // Deduplicate across categories while preserving counts for weight.
  const uniqueFlagged = new Set(
    transactions
      .filter(t => t.flags && t.flags.length > 0)
      .flatMap(t => t.flags)
      .filter(Boolean)
  ).size;
  const maxFlags = Math.max(recurring, unusual, uniqueFlagged);

  if (maxFlags <= flagDensity.cleanMax) flagSub = 100;
  else if (maxFlags <= flagDensity.noisyMax) flagSub = 75;
  else if (maxFlags <= flagDensity.heavyMax) flagSub = 50;
  else if (maxFlags <= flagDensity.extremeMax) flagSub = 25;
  else flagSub = 10;

  // Weighted total
  const score =
    Math.round(savingsSub * 0.4 + expenseSub * 0.4 + flagSub * 0.2);

  // Clamp
  const clamped = Math.min(100, Math.max(0, score));

  const getHealthLabel = getHealthScoreLabel;

  return {
    score: clamped,
    label: getHealthLabel(clamped).label,
    color: getHealthLabel(clamped).color,
    breakdown: {
      savingsRate: Math.round(savingsSub),
      expenseToIncome: Math.round(expenseSub),
      flagDensity: Math.round(flagSub),
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      netBalance: Math.round((income - expenses) * 100) / 100,
      savingsRatePercent: income > 0 ? Math.round(((income - expenses) / income) * 100 * 10) / 10 : 0,
    },
  };
};

/**
 * Robust CSV parser mapping bank statement columns to the app's internal transaction shape.
 * Accepts Date, Description, Amount (+/-), and Category-like columns.
 */
export const parseCSV = (csvString) => {
  if (!csvString || typeof csvString !== 'string') return [];
  const lines = csvString
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Detect header row (first line containing a recognizable column).
  const firstLine = (lines[0] || '').toLowerCase();
  const hasHeader =
    /date|description|amount|category/.test(firstLine) ||
    /transaction|merchant|memo|payee/.test(firstLine);

  const header = hasHeader ? lines[0].split(',').map(h => h.trim().toLowerCase()) : [];
  const colDate = hasHeader
    ? header.findIndex(h => /date|transaction date|posted date/i.test(h))
    : 0;
  const colDesc = hasHeader
    ? header.findIndex(h => /description|merchant|memo|payee|transaction|category/i.test(h))
    : 1;
  const colAmt = hasHeader
    ? header.findIndex(h => /amount|debit|credit|transaction amount/i.test(h))
    : 2;
  const colCat = hasHeader
    ? header.findIndex(h => /category|type/.test(h))
    : 3;

  const rows = hasHeader ? lines.slice(1) : lines;
  const transactions = [];

  rows.forEach((line, idx) => {
    const cells = line.split(',').map(c => c.trim());
    let date, description, amount, category;

    if (colDate >= 0 && colDate < cells.length && cells[colDate]) date = cells[colDate];
    if (colDesc >= 0 && colDesc < cells.length && cells[colDesc]) description = cells[colDesc];
    if (colAmt >= 0 && colAmt < cells.length && cells[colAmt]) amount = cells[colAmt];
    if (colCat >= 0 && colCat < cells.length && cells[colCat]) category = cells[colCat];

    if (!description && !amount) return;

    // Normalize: if one of amount/description missing, try to infer from a combined cell.
    if (!description && amount) {
      // Heuristic: "Date | Description - Amount" style.
      const parts = amount.split(/(?=\s[-\+−]\s|\s\+\s|\s\-\s|\s[−\-]\s)/);
      description = parts[0] || '';
      amount = parts.slice(1).join(' ') || amount;
    }

    // Guard against missing amount cells; fall back to extracting from the description.
    if (amount == null || amount === '') {
      if (description) {
        const parenMatch = description.match(/\(([^)]*\d[^)]*)\)/);
        const trailingMatch = description.match(/(-?\+?\$?\s*[\d,]+\.?\d*)\s*$/);
        if (parenMatch) amount = `(${parenMatch[1]})`;
        else if (trailingMatch) amount = trailingMatch[1];
        else return;
        // Strip the extracted amount from the description.
        description = description.replace(/\(([^)]*\d[^)]*)\)\s*$/, '').replace(/(-?\+?\$?\s*[\d,]+\.?\d*)\s*$/, '').trim() || description;
      } else {
        return;
      }
    }

    const rawAmount = String(amount);
    const isParenNegative = rawAmount.includes('(') && rawAmount.includes(')');

    // Parse numeric amount. Normalize parentheses before stripping symbols.
    const cleaned = rawAmount.replace(/[()]/g, '').replace(/[^0-9.,\s-]/g, '');
    let numericAmount = parseFloat(cleaned);
    if (isParenNegative && !isNaN(numericAmount)) {
      numericAmount = -Math.abs(numericAmount);
    }

    if (isNaN(numericAmount)) return;

    // Normalize date to YYYY-MM-DD if possible, otherwise null.
    let normalizedDate = null;
    if (date) {
      const trimmedDate = date.trim();
      // Already a valid ISO date?
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate);
      if (iso) normalizedDate = trimmedDate;
      else {
        // Try common formats: MM/DD/YYYY, DD/MM/YYYY (assume US when ambiguous? we keep as-is).
        const d = new Date(trimmedDate);
        if (!isNaN(d.getTime())) normalizedDate = d.toISOString().slice(0, 10);
        else normalizedDate = trimmedDate;
      }
    }

    // Determine credit/debit.
    let type = 'debit';
    let displayAmount = Math.abs(numericAmount);
    if (rawAmount.includes('-') || rawAmount.includes('−') || rawAmount.includes('(') || numericAmount < 0) {
      type = 'debit';
    } else if (rawAmount.includes('+') || numericAmount > 0) {
      type = 'credit';
    }

    // Default category fallback; leave blank so UI renders unknown if needed.
    category = category || '';

    transactions.push({
      date: normalizedDate,
      description: description || 'Unnamed Transaction',
      amount: displayAmount,
      category: category || '',  // keep raw category; UI maps via colors
      type,
      flags: [],
      source: 'csv',
    });
  });

  return transactions;
};

/**
 * Update simulateAIResponse to use dynamic values and CSV-aware data.
 */
export const simulateAIResponse = (query, transactions) => {
  const health = calculateHealthScore(transactions);
  const totals = calculateTotals(transactions);
  const categories = getCategoryBreakdown(transactions);
  const recurring = getRecurringTransactions(transactions);

  const diningItem = categories.find(c => c.name.toLowerCase().includes('dining'));
  const shoppingItem = categories.find(c => c.name.toLowerCase().includes('shopping'));

  if (query === "Where am I spending the most money?") {
    if (categories.length === 0) {
      return `📊 **Spending Analysis:**\nNo debit expense transactions were found in this statement (--).\n\n💰 Total Income: ${formatCurrency(totals.income)}\n💸 Total Expenses: --`;
    }

    const top1 = categories[0];
    const top2 = categories[1] || { name: '--', value: 0 };
    const top3 = categories[2] || { name: '--', value: 0 };

    return `Based on your statement analysis, here is your spending breakdown:\n\n📊 **Top Spending Categories Present:**\n${categories.map((c, i) => `${i + 1}. **${c.name}**: ${formatCurrency(c.value)}`).join('\n')}\n\n💡 **Key Insight:** **${top1.name}** is your largest expense category at ${formatCurrency(top1.value)} (${totals.expenses > 0 ? ((top1.value / totals.expenses) * 100).toFixed(1) : 0}% of total debit spending).\n\n` +
      (diningItem ? `Dining Spending: ${formatCurrency(diningItem.value)}` : `Dining Spending: -- (not present in statement)`) +
      `\n` +
      (shoppingItem ? `Shopping Spending: ${formatCurrency(shoppingItem.value)}` : `Shopping Spending: -- (not present in statement)`);
  }

  if (query === "Find all subscriptions I can cancel.") {
    if (recurring.length === 0) {
      return `🔍 **Subscription Audit:**\n\nNo active recurring subscriptions were detected in this bank statement (--).\n\n💰 **Monthly Subscription Cost:** --\n📅 **Estimated Annual Cost:** --\n\n✅ Your statement is clean of recurring subscription fees.`;
    }

    const monthlyCost = recurring.reduce((sum, r) => sum + Math.abs(r.amount), 0);
    return `I found **${recurring.length} recurring charges** in your statement:\n\n${recurring.map(r => `• **${r.description}**: ${formatCurrency(Math.abs(r.amount))}/month`).join('\n')}\n\n💰 **Total Monthly Subscription Cost:** ${formatCurrency(monthlyCost)}\n📅 **Estimated Annual Cost:** ${formatCurrency(monthlyCost * 12)}`;
  }

  if (query === "How much can I safely invest this month?") {
    return `Based on your financial analysis:\n\n💰 **Monthly Income:** ${totals.income > 0 ? formatCurrency(totals.income) : '--'}\n💸 **Monthly Expenses:** ${totals.expenses > 0 ? formatCurrency(totals.expenses) : '--'}\n📊 **Net Cash Flow:** ${formatCurrency(totals.netBalance)}\n\n🛡️ **Recommended Emergency Buffer:** ${totals.expenses > 0 ? formatCurrency(totals.expenses * 0.15) : '--'}\n\n✅ **Safe to Invest:** ${totals.netBalance > 0 ? formatCurrency(Math.max(0, totals.netBalance - totals.expenses * 0.15)) : '--'}\n\n⚠️ *This is an automated analysis based on uploaded statement data.*`;
  }

  if (query === "Compare my spending to last month.") {
    if (categories.length === 0) {
      return `📊 **Month-over-Month Comparison:**\nNo debit category data available for comparison (--).`;
    }

    return `📊 **Current Statement Breakdown:**\n\n| Category | This Month | Status |\n|----------|------------|--------|\n` +
      categories.map(c => `| ${c.name} | ${formatCurrency(c.value)} | Present |`).join('\n') +
      `\n\n💡 Categories not present in this statement (e.g. Dining, Subscriptions) are marked as **--**.`;
  }

  if (query === "Create a budget plan for next month.") {
    return `📋 **Custom Budget Allocation:**\n\nBased on your actual statement income of ${totals.income > 0 ? formatCurrency(totals.income) : '--'}:\n\n` +
      categories.map(c => `• **${c.name}**: Allocation target ${formatCurrency(c.value)}`).join('\n') +
      `\n\nCategories absent from your statement (e.g. Dining): **--**`;
  }

  // CSV/Dynamic-aware fallback.
  return `I've analyzed your statement. Net Balance: ${formatCurrency(totals.netBalance)}. Categories present: ${categories.map(c => c.name).join(', ') || '--'}. Absent categories marked as --.`;
};
