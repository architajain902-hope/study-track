import { useCallback, useEffect, useState } from 'react';

export const THEME_KEY = 'satistudy-theme';

function getInitialTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}

// Ambient energy themes — shift UI accents to match the student's cognitive
// battery: 'high' (vibrant), 'med' (compact), 'low' (calm, soft tones).
export function applyEnergyTheme(level = 'med') {
  const lvl = level === 'high' || level === 'low' ? level : 'med';
  document.documentElement.setAttribute('data-energy', lvl);
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}