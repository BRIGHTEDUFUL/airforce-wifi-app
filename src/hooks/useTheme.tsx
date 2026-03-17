import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
});

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('afkm_theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    // No saved value — default to light regardless of OS
    return 'light';
  });

  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // light = always light, dark = always dark, system = follow OS
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const setTheme = (mode: ThemeMode) => {
    const newIsDark = mode === 'dark' || (mode === 'system' && systemDark);
    // Apply immediately — don't wait for re-render
    applyTheme(newIsDark);
    setThemeState(mode);
    localStorage.setItem('afkm_theme', mode);
    localStorage.removeItem('afkm_dark');
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
