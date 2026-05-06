'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@/types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (!res.ok) {
      setUser(null);
      return;
    }

    const payload = (await res.json()) as { user: AuthUser };
    setUser(payload.user);
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    setUser(null);
    window.location.href = '/';
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
