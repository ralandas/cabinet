'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiLogin, apiRegister, getProfile, type User } from './api';

const TOKEN_KEY = 'progon_pro_token';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  register: (input: { email?: string; phone?: string; password: string; name?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore token from localStorage on mount.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      // Load user profile.
      getProfile(stored)
        .then(setUser)
        .catch(() => {
          // Token expired or invalid — clear it.
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const saveToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    const result = await apiLogin({ login: loginId, password });
    saveToken(result.token);
    // Fetch full profile (login response may not include all fields).
    const profile = await getProfile(result.token);
    setUser(profile);
  }, [saveToken]);

  const register = useCallback(async (input: { email?: string; phone?: string; password: string; name?: string }) => {
    const result = await apiRegister(input);
    saveToken(result.token);
    const profile = await getProfile(result.token);
    setUser(profile);
  }, [saveToken]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const profile = await getProfile(token);
    setUser(profile);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
