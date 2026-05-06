'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearStoredSession,
  getStoredSession,
  loginWithServerUser,
  signupWithServerUser,
  updateStoredSessionProfile,
} from '@/lib/auth-client';
import type { AuthSessionUser } from '@/lib/auth';

interface AuthContextValue {
  user: AuthSessionUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  signup: (input: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ error?: string }>;
  updateProfile: (input: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  }) => { error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(getStoredSession());
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      login: async (username, password) => {
        const result = await loginWithServerUser(username, password);
        if ('user' in result) {
          setUser(result.user);
          return {};
        }
        return { error: result.error };
      },
      signup: async (input) => {
        const result = await signupWithServerUser(input);
        if ('user' in result) {
          setUser(result.user);
          return {};
        }
        return { error: result.error };
      },
      updateProfile: (input) => {
        const result = updateStoredSessionProfile(input);
        if ('user' in result) {
          setUser(result.user);
          return {};
        }
        return { error: result.error };
      },
      logout: () => {
        clearStoredSession();
        setUser(null);
      },
    }),
    [isReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}