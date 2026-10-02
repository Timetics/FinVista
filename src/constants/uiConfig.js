// UI configuration constants extracted from Dashboard and other components
// Keeps components free of hardcoded display configuration.

export const categoryColors = {
  Housing: '#6366f1',
  Dining: '#f59e0b',
  Subscriptions: '#8b5cf6',
  Utilities: '#06b6d4',
  Shopping: '#f43f5e',
  Groceries: '#10b981',
  Transportation: '#3b82f6',
  Insurance: '#ec4899',
  Healthcare: '#14b8a6',
  Debt: '#ef4444',
  Income: '#22c55e',
  'Checks & Transfers': '#8b5cf6',
  'ATM & Cash': '#f59e0b',
  Deposits: '#10b981',
};

export const categoryIcons = {
  Housing: 'Home',
  Dining: 'UtensilsCrossed',
  Subscriptions: 'Repeat',
  Utilities: 'Zap',
  Shopping: 'ShoppingBag',
  Groceries: 'ShoppingCart',
  Transportation: 'Car',
  Insurance: 'Shield',
  Healthcare: 'Heart',
  Debt: 'CreditCard',
  Income: 'TrendingUp',
  'Checks & Transfers': 'FileText',
  'ATM & Cash': 'DollarSign',
  Deposits: 'ArrowDown',
};

export const aiInsights = [
  {
    id: 1,
    severity: 'warning',
    title: '8 Recurring Subscriptions Detected',
    description: 'You have 8 active subscriptions totaling $144.95/month ($1,739.40/year). Netflix, Spotify, Adobe CC, and Planet Fitness are your top costs.',
    action: 'Review Subscriptions',
    yearlyCost: 1739.40,
  },
  {
    id: 2,
    severity: 'alert',
    title: 'Unusual Spending Spike: Shopping',
    description: 'Your Shopping category spending is 47% higher than your 3-month average. Notable: Best Buy Electronics ($349.99) and Home Depot ($215.67).',
    action: 'View Details',
  },
  {
    id: 3,
    severity: 'tip',
    title: 'Savings Opportunity: Dining',
    description: 'You spent $201.54 on dining this month. Reducing dining out by 30% could save you ~$60/month or $724/year.',
    action: 'See Savings Plan',
    potentialSavings: 724,
  },
  {
    id: 4,
    severity: 'success',
    title: 'Positive Cash Flow Maintained',
    description: 'Your income exceeds expenses by $3,377. Your savings rate of 20.7% is above the recommended 20% threshold.',
    action: 'Investment Tips',
  },
];

export const chatSuggestions = [
  "Where am I spending the most money?",
  "Find all subscriptions I can cancel.",
  "How much can I safely invest this month?",
  "Compare my spending to last month.",
  "Create a budget plan for next month.",
];

export const financialHealthMetrics = {
  score: 74,
  label: 'Good',
  breakdown: [
    { metric: 'Savings Rate', value: 82, max: 100 },
    { metric: 'Debt Ratio', value: 65, max: 100 },
    { metric: 'Emergency Fund', value: 70, max: 100 },
    { metric: 'Investment Diversity', value: 58, max: 100 },
  ],
};

export const dateRanges = [
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: 'YTD', label: 'Year to Date' },
  { value: 'All', label: 'All' },
];

export const userGreeting = {
  aiWelcomeText: 'Hello! I am FinVista AI. I have analyzed your bank statement. Ask me anything about your spending, subscriptions, or investment potential!',
};
