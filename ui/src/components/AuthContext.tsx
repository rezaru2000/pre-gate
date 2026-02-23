import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { config } from '../config/env';

interface AuthState {
  email: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ email: null, loading: true });

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/admin/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setState({ email: data?.email ?? null, loading: false }))
      .catch(() => setState({ email: null, loading: false }));
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${config.apiBaseUrl}/api/admin/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Login failed');
    }
    const data = await res.json();
    setState({ email: data.email, loading: false });
  }

  async function logout() {
    await fetch(`${config.apiBaseUrl}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setState({ email: null, loading: false });
  }

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
