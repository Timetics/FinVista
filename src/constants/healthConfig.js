// Scoring configuration for the dynamic financial health score.
// Kept separate so calculateHealthScore() and tests can tweak bounds without
// touching component logic.

export const HEALTH_SCORE_CONFIG = {
  maxScore: 100,

  // Savings-rate bucket. Higher is better for this component.
  savingsRate: {
    goodMin: 20, // 20%+ savings rate => "good" savings sub-score
    poorMin: 5,  // below 5% => "poor" savings sub-score
  },

  // Expense-to-income ratio buckets. Lower is better.
  expenseToIncome: {
    healthyMax: 0.5, // <= 50% => "healthy" sub-score
    warningMax: 0.8, // <= 80% => "warning" sub-score
  },

  // Flag density. More flags => lower score.
  flagDensity: {
    cleanMax: 0,     // 0 flags
    noisyMax: 2,     // 1-2 flags
    heavyMax: 4,     // 3-4 flags
    extremeMax: 5,   // 5+ flags
  },
};
