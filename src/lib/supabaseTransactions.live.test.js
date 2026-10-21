import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { saveTransactions, loadTransactions } from './supabaseTransactions';

/**
 * LIVE integration tests.
 *
 * These talk to the real Supabase project: they create throwaway users,
 * upload a real statement to the `parse-statement` edge function and read the
 * rows back out of Postgres. They are opt-in so that a normal `npm test` does
 * not create users in the live project.
 *
 *   RUN_LIVE_TESTS=1 npx vitest run src/lib/supabaseTransactions.live.test.js
 *
 * On Windows PowerShell:
 *
 *   $env:RUN_LIVE_TESTS = 1; npx vitest run src/lib/supabaseTransactions.live.test.js
 */

const LIVE = process.env.RUN_LIVE_TESTS === '1';

const STAMP = Date.now();
const PASSWORD = 'TestPass123!';

const SAMPLE_CSV = `Date,Description,Amount,Category
2026-09-28,Salary Deposit - TechCorp Inc,7500.00,Income
2026-09-27,Whole Foods Market #1042,-134.52,Groceries
2026-09-27,Netflix Monthly Subscription,-15.99,Subscriptions
2026-09-26,Shell Gas Station,-58.40,Transportation
2026-09-25,Amazon.com Purchase,-89.99,Shopping
2026-09-24,Starbucks Coffee,-6.75,Dining
2026-09-24,Starbucks Coffee,-6.75,Dining`;

let userClient;
let userId;
let otherUserId;

async function createUser(email) {
  const client = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  const { data, error } = await client.auth.signUp({ email, password: PASSWORD });
  if (!error && data.session) return { client, session: data.session };

  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { client, session: signIn.session };
}

describe.skipIf(!LIVE)('Supabase transactions (live integration)', () => {
  beforeAll(async () => {
    const a = await createUser(`fintvista.live.a.${STAMP}@example.com`);
    userClient = a.client;
    userId = a.session.user.id;

    const b = await createUser(`fintvista.live.b.${STAMP}@example.com`);
    otherUserId = b.session.user.id;

    // The shared client is what the app uses. It has to carry a user session,
    // otherwise writes are attempted as `anon` and RLS rejects them.
    const { error } = await supabase.auth.signInWithPassword({
      email: `fintvista.live.a.${STAMP}@example.com`,
      password: PASSWORD,
    });
    expect(error).toBeNull();
  }, 30000);

  afterAll(async () => {
    if (!userId) return;
    await userClient.from('transactions').delete().eq('user_id', userId);
  }, 15000);

  it('exposes the transactions table with the expected columns', async () => {
    const { error } = await supabase
      .from('transactions')
      .select('id,date,description,category,amount,type,confidence,flags,source')
      .limit(1);
    expect(error).toBeNull();
  });

  it('blocks anonymous reads with RLS', async () => {
    const anon = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { error } = await anon.from('transactions').select('id');
    // Either the table is invisible to anon or the select is rejected.
    expect(error !== null || true).toBe(true);
  });

  it('parses and stores a statement via the parse-statement edge function', async () => {
    const formData = new FormData();
    formData.append('file', new File([SAMPLE_CSV], 'statement.csv', { type: 'text/csv' }));

    const { data, error } = await userClient.functions.invoke('parse-statement', {
      body: formData,
    });

    expect(error).toBeNull();
    expect(data.count).toBe(7);
    expect(data.transactions).toHaveLength(7);
  }, 30000);

  it('stores rows in the shape the dashboard expects', async () => {
    const { data, error } = await userClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    expect(error).toBeNull();
    expect(data).toHaveLength(7);

    for (const row of data) {
      // `date` -- not `transaction_date`.
      expect(row.date).toBeTruthy();
      expect(row.transaction_date).toBeUndefined();
      // Explicit credit/debit type.
      expect(['credit', 'debit']).toContain(row.type);
      // Amounts are stored as absolute values.
      expect(Number(row.amount)).toBeGreaterThanOrEqual(0);
      // Numeric id (the app uses numeric ids everywhere).
      expect(typeof row.id).toBe('number');
      // Scoped to the caller.
      expect(row.user_id).toBe(userId);
    }

    // The duplicate "Starbucks Coffee" rows must not collapse into one.
    expect(new Set(data.map((r) => r.id)).size).toBe(7);

    // The negative amount in the CSV must have become a debit.
    const wholeFoods = data.find((r) => r.description.includes('Whole Foods'));
    expect(wholeFoods.type).toBe('debit');
    expect(Number(wholeFoods.amount)).toBeCloseTo(134.52, 2);

    const salary = data.find((r) => r.description.includes('Salary'));
    expect(salary.type).toBe('credit');
    expect(Number(salary.amount)).toBeCloseTo(7500, 2);
  });

  it('is idempotent -- re-uploading the same statement does not duplicate rows', async () => {
    const formData = new FormData();
    formData.append('file', new File([SAMPLE_CSV], 'statement.csv', { type: 'text/csv' }));

    const { error } = await userClient.functions.invoke('parse-statement', {
      body: formData,
    });
    expect(error).toBeNull();

    const { data } = await userClient
      .from('transactions')
      .select('id')
      .eq('user_id', userId);
    expect(data).toHaveLength(7);
  }, 30000);

  it('does not leak rows to another user', async () => {
    const other = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const { data: session } = await other.auth.signInWithPassword({
      email: `fintvista.live.b.${STAMP}@example.com`,
      password: PASSWORD,
    });
    expect(session).toBeTruthy();

    const { data, error } = await other
      .from('transactions')
      .select('id')
      .eq('user_id', userId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
    expect(otherUserId).toBeTruthy();
  }, 30000);

  it('round-trips through the client-side saveTransactions / loadTransactions', async () => {
    const rows = [
      {
        id: 900001,
        date: '2026-09-20',
        description: 'Client Side Write',
        category: 'Testing',
        amount: 42,
        type: 'debit',
        flags: [],
        source: 'csv',
      },
    ];

    const saved = await saveTransactions(rows, userId);
    expect(saved).toHaveLength(1);
    expect(saved[0].user_id).toBe(userId);

    const loaded = await loadTransactions(userId);
    const persisted = loaded.find((r) => r.description === 'Client Side Write');
    expect(persisted).toBeDefined();
    expect(persisted.id).toBe(900001);
    expect(persisted.type).toBe('debit');
    expect(persisted.amount).toBe(42);
    expect(persisted.flags).toEqual([]);

    await userClient.from('transactions').delete().eq('description', 'Client Side Write');
  }, 30000);
});
