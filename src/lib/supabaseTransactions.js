import { supabase } from './supabaseClient';
import { getCurrentUser } from './supabaseAuth';

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
    return data || [];
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

  const rows = transactions.map((t) => ({
    ...t,
    user_id: uid,
  }));

  const { error } = await supabase.from('transactions').upsert(rows, {
    onConflict: ['user_id', 'id'],
  });

  if (error) throw error;
  return rows;
}
