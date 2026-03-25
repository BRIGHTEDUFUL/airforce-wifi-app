import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'Operator' | 'Viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT payload without a library
function parseJwt(token: string): { exp?: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('afkm_token');
    localStorage.removeItem('afkm_user');
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('afkm_token');
    const savedUser  = localStorage.getItem('afkm_user');
    if (savedToken && savedUser && !isTokenExpired(savedToken)) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (savedToken) {
      // Token exists but expired — clear it
      logout();
    }
    setIsLoading(false);
  }, [logout]);

  // Auto-logout when token expires
  useEffect(() => {
    if (!token) return;
    const payload = parseJwt(token);
    if (!payload?.exp) return;
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) { logout(); return; }
    const timer = setTimeout(logout, msUntilExpiry);
    return () => clearTimeout(timer);
  }, [token, logout]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('afkm_token', newToken);
    localStorage.setItem('afkm_user', JSON.stringify(newUser));
  };

  // Centralized fetch — attaches auth header, auto-logouts on 401/403
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 401 || res.status === 403) logout();
      return res;
    } catch (err) {
      // Network failure — return a synthetic 503 response so callers don't crash
      console.error('[apiFetch] Network error:', url, err);
      return new Response(JSON.stringify({ message: 'Network error — server unreachable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }, [token, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-command-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
