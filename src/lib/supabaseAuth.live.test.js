import { describe, it, expect } from 'vitest';
import { supabase } from './supabaseClient';
import { signIn, signOut, getCurrentUser } from './supabaseAuth';

/**
 * LIVE auth integration tests.
 *
 * These create throwaway users on the real Supabase project. They are opt-in:
 *
 *   RUN_LIVE_TESTS=1 npx vitest run src/lib/supabaseAuth.live.test.js
 */

const LIVE = process.env.RUN_LIVE_TESTS === '1';
const STAMP = Date.now();
const PASSWORD = 'TestPass123!';

describe.skipIf(!LIVE)('Supabase auth (live integration)', () => {
  it('signs up, then signs out and drops the session everywhere', async () => {
    const email = `fintvista.auth.${STAMP}@example.com`;

    // --- sign up -------------------------------------------------------
    const { data, error } = await supabase.auth.signUp({
      email,
      password: PASSWORD,
    });
    expect(error).toBeNull();
    expect(data.user.email).toBe(email);

    // The session must be live before we try to tear it down.
    const { data: withSession } = await supabase.auth.getSession();
    expect(withSession.session).toBeTruthy();
    expect((await getCurrentUser())?.email).toBe(email);

    // --- watch for the SIGNED_OUT event -------------------------------
    const events = [];
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      events.push({ event, hasSession: Boolean(session) });
    });
    // Let the listener attach before signing out.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // --- sign out ------------------------------------------------------
    await signOut();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The auth event must fire so the AuthContext can drop `user`.
    expect(events.some((e) => e.event === 'SIGNED_OUT' && e.hasSession === false)).toBe(true);

    // The session must be gone from the client.
    const { data: afterSignOut } = await supabase.auth.getSession();
    expect(afterSignOut.session).toBeNull();
    expect(await getCurrentUser()).toBeNull();

    subscription.unsubscribe();
  }, 30000);

  it('can sign in again with the same credentials after signing out', async () => {
    const email = `fintvista.auth.relogin.${STAMP}@example.com`;

    await supabase.auth.signUp({ email, password: PASSWORD });
    await signOut();

    // signIn() returns the auth data directly ({ user, session }) and throws
    // on failure -- it does not return a { data, error } pair.
    const result = await signIn(email, PASSWORD);
    expect(result.user.email).toBe(email);
    expect((await getCurrentUser())?.email).toBe(email);

    // Leave the shared client in a signed-out state for the next test.
    await signOut();
  }, 30000);
});
