'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';
  const preferredLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const label = mounted ? preferredLabel : 'Toggle color scheme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300/70 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
    >
      <span aria-hidden="true" className="text-base">
        {mounted ? (isDark ? '🌙' : '☀️') : '☀️'}
      </span>
      <span className="hidden sm:inline">{mounted ? (isDark ? 'Dark' : 'Light') : 'Light'}</span>
    </button>
  );
}
