import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { signOut as signOutRequest } from '../lib/supabaseAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign the current user out.
   *
   * `supabase.auth.signOut()` revokes the refresh token server-side, clears the
   * persisted session and fires a SIGNED_OUT event, which the listener above
   * turns into `user === null`.
   */
  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOutRequest();
      setUser(null);
    } finally {
      setSigningOut(false);
    }
  }, []);

  const value = { user, loading, signingOut, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
