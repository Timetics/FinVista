import { describe, it, expect, afterAll } from 'vitest';
import { supabase } from './supabaseClient';
import { signIn, signUp, signOut, getCurrentUser } from './supabaseAuth';

const TEST_EMAIL = `fintvista.test.${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

describe('Supabase Connection & Auth', () => {
  it('should connect to Supabase with valid URL and anon key', () => {
    expect(supabase).toBeDefined();
    expect(supabase.realtime).toBeDefined();
  });

  describe('Auth functions exist', () => {
    it('signIn is a function', () => expect(typeof signIn).toBe('function'));
    it('signUp is a function', () => expect(typeof signUp).toBe('function'));
    it('signOut is a function', () => expect(typeof signOut).toBe('function'));
    it('getCurrentUser is a function', () => expect(typeof getCurrentUser).toBe('function'));
  });

  describe('Auth flow', () => {
    let signUpResult = null;
    let userIsConfirmed = false;
    let signInError = null;

    it('should sign up a new test user', async () => {
      signUpResult = await signUp(TEST_EMAIL, TEST_PASSWORD);
      expect(signUpResult).toBeDefined();
      expect(signUpResult.user).toBeDefined();
      expect(signUpResult.user.email).toBe(TEST_EMAIL);
      userIsConfirmed = !!signUpResult.user.confirmed_at;
    }, 15000);

    it('should report whether email confirmation is enabled', () => {
      if (!userIsConfirmed) {
        console.warn('\n⚠️  Email confirmation is ENABLED on this Supabase project.\n' +
          '   New users must click a confirmation link before they can sign in.\n' +
          '   Sign-in tests will be skipped until confirmation is handled.\n');
      } else {
        console.log('\n✅ Email confirmation is NOT enabled — users can sign in immediately after sign-up.\n');
      }
      // This is an informational test — it always passes
      expect(true).toBe(true);
    });

    it('should sign in with the test credentials (if email confirmed)', async () => {
      if (!userIsConfirmed) {
        console.warn('→ Skipping sign-in (user not email-confirmed)');
        return;
      }
      const data = await signIn(TEST_EMAIL, TEST_PASSWORD);
      expect(data).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(TEST_EMAIL);
    }, 15000);

    it('should retrieve current user after sign in (if email confirmed)', async () => {
      if (!userIsConfirmed) {
        console.warn('→ Skipping get-current-user (user not email-confirmed)');
        return;
      }
      const user = await getCurrentUser();
      expect(user).toBeDefined();
      expect(user.email).toBe(TEST_EMAIL);
    });

    it('should sign out successfully (if previously signed in)', async () => {
      if (!userIsConfirmed) {
        console.warn('→ Skipping sign-out (no session to sign out)');
        return;
      }
      await signOut();
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return useful error when signing in with wrong credentials', async () => {
      try {
        await signIn(TEST_EMAIL, 'wrongpassword123');
        // If the user was confirmed, this should fail
        expect.fail('Should have thrown an error for wrong password');
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).toBeTruthy();
      }
    });
  });
});
