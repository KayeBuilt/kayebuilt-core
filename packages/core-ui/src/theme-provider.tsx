'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  /** `theme` resolved against the OS preference when `theme === 'system'` — what should actually drive the `.dark` class. */
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  /** localStorage key the chosen theme persists under. Set to `undefined` to disable persistence. */
  storageKey?: string;
}

/**
 * Framework-agnostic theme provider (no `next-themes` dependency, so
 * core-ui stays usable outside Next.js apps too). Toggles a `.dark` class
 * on `document.documentElement` — apps' Tailwind config should use
 * `darkMode: 'class'` to match.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'kayebuilt-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined' || !storageKey) return defaultTheme;
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : defaultTheme;
  });

  const resolvedTheme = theme === 'system' ? resolveSystemTheme() : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      if (typeof window !== 'undefined' && storageKey) {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be called within a <ThemeProvider>.');
  }
  return ctx;
}
