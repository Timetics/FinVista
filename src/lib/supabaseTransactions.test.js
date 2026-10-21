import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client and auth helpers so these tests run fully offline.
const selectMock = vi.fn();
const eqMock = vi.fn();
const upsertMock = vi.fn();
const fromMock = vi.fn();

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: (...args) => fromMock(...args),
  },
}));

const getCurrentUserMock = vi.fn();
vi.mock('./supabaseAuth', () => ({
  getCurrentUser: (...args) => getCurrentUserMock(...args),
}));

const { loadTransactions, saveTransactions } = await import('./supabaseTransactions');

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ id: 'user-123' });
  eqMock.mockResolvedValue({ data: [], error: null });
  selectMock.mockReturnValue({ eq: eqMock });
  upsertMock.mockResolvedValue({ error: null });
  fromMock.mockReturnValue({ select: selectMock, upsert: upsertMock });
});

describe('saveTransactions (unit, mocked supabase)', () => {
  it('throws when there is no authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(saveTransactions([{ id: 1 }])).rejects.toThrow('No authenticated user');
  });

  it('upserts rows tagged with user_id and returns them', async () => {
    const rows = [
      { id: 1, description: 'Coffee', amount: 5, type: 'debit' },
      { id: 2, description: 'Salary', amount: 1000, type: 'credit' },
    ];
    const saved = await saveTransactions(rows, 'user-123');
    expect(fromMock).toHaveBeenCalledWith('transactions');
    expect(upsertMock).toHaveBeenCalledWith(
      rows.map(r => ({ ...r, user_id: 'user-123' })),
      { onConflict: ['user_id', 'id'] }
    );
    expect(saved).toHaveLength(2);
    expect(saved.every(r => r.user_id === 'user-123')).toBe(true);
  });

  it('propagates supabase errors', async () => {
    upsertMock.mockResolvedValue({ error: new Error('boom') });
    await expect(saveTransactions([{ id: 1 }], 'user-123')).rejects.toThrow('boom');
  });

  it('drops fields that do not exist as columns on the table', async () => {
    // PostgREST rejects the whole request if the payload contains an unknown
    // column, so unknown fields must be stripped before the upsert.
    await saveTransactions(
      [{ id: 7, description: 'Coffee', amount: 5, type: 'debit', not_a_column: 'x' }],
      'user-123'
    );
    const [payload] = upsertMock.mock.calls[0];
    expect(payload[0]).toEqual({
      user_id: 'user-123',
      id: 7,
      description: 'Coffee',
      amount: 5,
      type: 'debit',
    });
    expect(payload[0]).not.toHaveProperty('not_a_column');
  });

  it('coerces amount to a number and flags to an array', async () => {
    await saveTransactions(
      [{ id: 8, amount: '12.34', flags: 'not-an-array' }],
      'user-123'
    );
    const [payload] = upsertMock.mock.calls[0];
    expect(payload[0].amount).toBe(12.34);
    expect(payload[0].flags).toEqual([]);
  });
});

describe('loadTransactions (unit, mocked supabase)', () => {
  it('returns [] when there is no authenticated user', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    await expect(loadTransactions()).resolves.toEqual([]);
  });

  it('queries the transactions table filtered by user_id', async () => {
    eqMock.mockResolvedValue({ data: [{ id: 1, user_id: 'user-123' }], error: null });
    const loaded = await loadTransactions('user-123');
    expect(fromMock).toHaveBeenCalledWith('transactions');
    expect(selectMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123');
    expect(loaded).toEqual([
      {
        id: 1,
        user_id: 'user-123',
        date: null,
        description: '',
        category: '',
        amount: 0,
        type: 'debit',
        confidence: 0,
        flags: [],
        source: 'csv',
      },
    ]);
  });

  it('normalizes raw database rows into the shape the UI expects', async () => {
    eqMock.mockResolvedValue({
      data: [
        {
          id: '42',
          user_id: 'user-123',
          date: '2026-09-28',
          description: 'Salary Deposit',
          category: 'Income',
          amount: '7500.5',
          type: 'credit',
          confidence: '99',
          flags: ['Recurring'],
          source: 'csv',
        },
      ],
      error: null,
    });
    const loaded = await loadTransactions('user-123');
    expect(loaded[0]).toMatchObject({
      id: 42,
      amount: 7500.5,
      type: 'credit',
      confidence: 99,
      flags: ['Recurring'],
    });
  });

  it('returns [] when the query fails', async () => {
    eqMock.mockResolvedValue({ data: null, error: new Error('nope') });
    await expect(loadTransactions('user-123')).resolves.toEqual([]);
  });
});

// Live integration tests: skipped by default because they require a configured
// Supabase project and network access. Run manually with:
//   npx vitest run src/lib/supabaseTransactions.live.test.js
describe.skip('Supabase Transactions (live integration)', () => {
  it('requires a live project — see git history for the original suite', () => {
    expect(true).toBe(true);
  });
});
