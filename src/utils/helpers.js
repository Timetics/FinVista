// Utility functions for data processing and formatting

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

export const calculateTotals = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = Math.abs(
    transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const netBalance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;

  return { income, expenses, netBalance, savingsRate };
};

export const getCategoryBreakdown = (transactions) => {
  const categories = {};
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const cat = t.category;
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += Math.abs(t.amount);
    });

  return Object.entries(categories)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
};

export const getRecurringTransactions = (transactions) => {
  return transactions.filter(t => t.flags.includes('Recurring'));
};

export const getUnusualTransactions = (transactions) => {
  return transactions.filter(t => t.flags.includes('Unusual'));
};

export const getHealthScoreLabel = (score) => {
  if (score >= 90) return { label: 'Excellent', color: '#10b981' };
  if (score >= 75) return { label: 'Good', color: '#22d3ee' };
  if (score >= 60) return { label: 'Fair', color: '#f59e0b' };
  if (score >= 40) return { label: 'Needs Attention', color: '#f97316' };
  return { label: 'Critical', color: '#f43f5e' };
};

export const getHealthScoreGradient = (score) => {
  if (score >= 75) return 'from-emerald-500 to-cyan-500';
  if (score >= 60) return 'from-amber-500 to-yellow-500';
  if (score >= 40) return 'from-orange-500 to-amber-500';
  return 'from-rose-500 to-red-500';
};

export const simulateAIResponse = (query, transactions) => {
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

  return `I've analyzed your statement. Net Balance: ${formatCurrency(totals.netBalance)}. Categories present: ${categories.map(c => c.name).join(', ') || '--'}. Absent categories marked as --.`;
};
