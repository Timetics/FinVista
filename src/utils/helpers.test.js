import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  parseCSV,
  calculateTotals,
  getCategoryBreakdown,
  getRecurringTransactions,
  getUnusualTransactions,
  formatCurrency,
  formatDate,
} from './helpers.js';

describe('calculateTotals', () => {
  it('calculates income, expenses, net balance, and savings rate', () => {
    const transactions = [
      { id: 1, date: '2026-09-01', description: 'Salary', category: 'Income', amount: 1000, type: 'credit', flags: [] },
      { id: 2, date: '2026-09-02', description: 'Food', category: 'Dining', amount: -50, type: 'debit', flags: [] },
    ];
    const totals = calculateTotals(transactions);
    expect(totals.income).toBe(1000);
    expect(totals.expenses).toBe(50);
    expect(totals.netBalance).toBe(950);
    expect(totals.savingsRate).toBeCloseTo(95);
  });

  it('returns zeros when no transactions provided', () => {
    const totals = calculateTotals([]);
    expect(totals.income).toBe(0);
    expect(totals.expenses).toBe(0);
    expect(totals.netBalance).toBe(0);
    expect(totals.savingsRate).toBe(0);
  });
});

describe('getCategoryBreakdown', () => {
  it('aggregates debit amounts by category', () => {
    const transactions = [
      { id: 1, date: '2026-09-01', description: 'A', category: 'Groceries', amount: -10, type: 'debit', flags: [] },
      { id: 2, date: '2026-09-02', description: 'B', category: 'Groceries', amount: -20, type: 'debit', flags: [] },
      { id: 3, date: '2026-09-03', description: 'C', category: 'Dining', amount: -15, type: 'debit', flags: [] },
      { id: 4, date: '2026-09-04', description: 'D', category: 'Income', amount: 100, type: 'credit', flags: [] },
    ];
    const breakdown = getCategoryBreakdown(transactions);
    expect(breakdown).toEqual([
      { name: 'Groceries', value: 30 },
      { name: 'Dining', value: 15 },
    ]);
  });
});

describe('getRecurringTransactions', () => {
  it('filters transactions with Recurring flag', () => {
    const transactions = [
      { id: 1, date: '2026-09-01', description: 'Rent', category: 'Housing', amount: -1000, type: 'debit', flags: ['Recurring'] },
      { id: 2, date: '2026-09-02', description: 'Coffee', category: 'Dining', amount: -5, type: 'debit', flags: [] },
    ];
    expect(getRecurringTransactions(transactions)).toEqual([transactions[0]]);
  });
});

describe('getUnusualTransactions', () => {
  it('filters transactions with Unusual flag', () => {
    const transactions = [
      { id: 1, date: '2026-09-01', description: 'A', category: 'Shopping', amount: -99, type: 'debit', flags: ['Unusual'] },
      { id: 2, date: '2026-09-02', description: 'B', category: 'Dining', amount: -5, type: 'debit', flags: [] },
    ];
    expect(getUnusualTransactions(transactions)).toEqual([transactions[0]]);
  });
});

describe('calculateHealthScore', () => {
  it('assigns a high score for strong income and low expenses', () => {
    const transactions = [
      { id: 1, date: '2026-09-01', description: 'Salary', category: 'Income', amount: 5000, type: 'credit', flags: [] },
      { id: 2, date: '2026-09-02', description: 'Coffee', category: 'Dining', amount: -5, type: 'debit', flags: [] },
    ];
    const result = calculateHealthScore(transactions);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.label).toBe('Excellent');
    expect(result.breakdown).toHaveProperty('savingsRate');
    expect(result.breakdown).toHaveProperty('expenseToIncome');
    expect(result.breakdown).toHaveProperty('flagDensity');
  });

  it('assigns a lower score for high expenses and heavy flag density', () => {
    const transactions = [];
    for (let i = 0; i < 30; i++) {
      transactions.push({
        id: i,
        date: `2026-09-${String(i + 1).padStart(2, '0')}`,
        description: `Large expense ${i}`,
        category: 'Shopping',
        amount: -200,
        type: 'debit',
        flags: ['Unusual'],
      });
    }
    // Add a small income to keep ratio meaningful.
    transactions.push({ id: 99, date: '2026-09-01', description: 'Side income', category: 'Income', amount: 200, type: 'credit', flags: [] });

    const result = calculateHealthScore(transactions);
    // With ~30 large expenses and 31 flagged items, the score should be low.
    expect(result.score).toBeLessThan(60);
    expect(result.label).toMatch(/Needs Attention|Critical/);
  });

  it('handles empty transactions gracefully', () => {
    const result = calculateHealthScore([]);
    expect(result.score).toBe(0);
    expect(result.label).toBe('Critical');
    expect(result.breakdown).toBeDefined();
  });
});

describe('parseCSV', () => {
  it('parses a standard header CSV', () => {
    const csv = [
      'Date,Description,Amount,Category',
      '2026-09-01,Salary Deposit,5000.00,Income',
      '2026-09-02,Whole Foods,-45.00,Groceries',
    ].join('\n');
    const transactions = parseCSV(csv);
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      date: '2026-09-01',
      description: 'Salary Deposit',
      amount: 5000,
      type: 'credit',
      category: 'Income',
    });
    expect(transactions[1]).toMatchObject({
      date: '2026-09-02',
      amount: 45,
      type: 'debit',
      category: 'Groceries',
    });
  });

  it('parses CSV without a header row', () => {
    const csv = [
      '2026-09-01,Salary Deposit,5000.00,Income',
      '2026-09-02,Whole Foods,-45.00,Groceries',
    ].join('\n');
    const transactions = parseCSV(csv);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].description).toBe('Salary Deposit');
  });

  it('handles parenthetical negative amounts', () => {
    const csv = [
      'Date,Description,Amount',
      '2026-09-01,Grocery,-15.00',
      '2026-09-02,Rent (350.00)',
    ].join('\n');
    const transactions = parseCSV(csv);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].amount).toBe(15);
    expect(transactions[0].type).toBe('debit');
    expect(transactions[1].amount).toBe(350);
    expect(transactions[1].type).toBe('debit');
  });

  it('handles empty input and invalid rows', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('   ')).toEqual([]);
    const csv = [
      'Date,Description,Amount',
      'invalid,no-amount',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([]);
  });
});

describe('formatCurrency', () => {
  it('formats with USD and two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(-67.89)).toBe('$67.89');
  });
});

describe('formatDate', () => {
  it('formats date strings', () => {
    const formatted = formatDate('2026-09-05');
    // Locale-dependent; just ensure it does not crash and returns a string.
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});
