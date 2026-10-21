import { supabase } from './supabaseClient';
import { getCurrentUser } from './supabaseAuth';

/**
 * The columns that actually exist on the `transactions` table.
 *
 * Rows are whitelisted against this list before they are written, because
 * PostgREST rejects the *entire* request when the payload contains a column
 * that does not exist in the table. (The client used to send a `source` field
 * that had no matching column, which silently failed every upsert.)
 */
const TRANSACTION_COLUMNS = [
  'id',
  'date',
  'description',
  'category',
  'amount',
  'type',
  'confidence',
  'flags',
  'source',
];

/**
 * Coerce a database row into the shape the UI expects.
 * Mirrors exactly what the parse-statement edge function and saveTransactions()
 * write, so a row behaves the same whether it arrived from Postgres or from a
 * local CSV parse.
 */
const normalizeRow = (row) => ({
  id: Number(row.id),
  user_id: row.user_id,
  date: row.date ?? null,
  description: row.description ?? '',
  category: row.category ?? '',
  amount: Number(row.amount) || 0,
  type: row.type ?? 'debit',
  confidence: Number(row.confidence) || 0,
  flags: Array.isArray(row.flags) ? row.flags : [],
  source: row.source ?? 'csv',
});

/**
 * Load persisted transactions for the authenticated user.
 * Falls back to getCurrentUser() if no userId is provided.
 * Returns an empty array if none exist or if the request fails.
 */
export async function loadTransactions(userId) {
  try {
    const uid = userId || (await getCurrentUser())?.id;
    if (!uid) {
      console.warn('[supabase] No authenticated user, skipping load');
      return [];
    }

    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('user_id', uid);

    if (error) throw error;
    return (data || []).map(normalizeRow);
  } catch (err) {
    console.error('[supabase] Failed to load transactions:', err.message);
    return [];
  }
}

/**
 * Persist the given transactions for the authenticated user.
 * Uses upsert on (user_id, id) so re-scanning the same statement
 * overwrites rather than duplicates.
 * Falls back to getCurrentUser() if no userId is provided.
 */
export async function saveTransactions(transactions, userId) {
  const uid = userId || (await getCurrentUser())?.id;
  if (!uid) throw new Error('No authenticated user');

  const rows = transactions.map((t) => {
    // Only send columns that exist on the table.
    const row = { user_id: uid };
    for (const column of TRANSACTION_COLUMNS) {
      if (t[column] === undefined || t[column] === null) continue;
      row[column] = t[column];
    }

    // `amount` is numeric in Postgres and follows the app-wide contract of
    // "absolute amount + explicit credit/debit type" -- never send a string
    // and never store a signed value.
    if (row.amount !== undefined) row.amount = Math.abs(Number(row.amount)) || 0;

    // `flags` is text[] -- never send anything else.
    if (row.flags !== undefined) row.flags = Array.isArray(row.flags) ? row.flags : [];

    return row;
  });

  const { error } = await supabase.from('transactions').upsert(rows, {
    onConflict: ['user_id', 'id'],
  });

  if (error) throw error;
  return rows;
}
