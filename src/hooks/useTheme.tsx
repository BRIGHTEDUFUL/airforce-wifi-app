import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'afkm_theme';

/** Resolve whether dark should be active given a mode */
function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Apply dark class to <html> immediately — no React re-render needed */
function applyDark(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/** Read saved theme, fall back to 'light' */
function getSavedTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {}
  return 'light';
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getSavedTheme);
  const [isDark, setIsDark] = useState(() => resolveIsDark(getSavedTheme()));

  // Keep in sync with OS changes when in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const dark = mq.matches;
        setIsDark(dark);
        applyDark(dark);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Sync on mount in case flash script didn't run
  useEffect(() => {
    applyDark(isDark);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    const dark = resolveIsDark(mode);
    // 1. Apply to DOM immediately
    applyDark(dark);
    // 2. Persist
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
    // 3. Update state
    setThemeState(mode);
    setIsDark(dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
