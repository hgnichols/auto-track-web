import type { MaintenanceStatus } from './types';

const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0';

export const primaryButtonClass =
  `${buttonBaseClass} border border-transparent bg-gradient-to-br from-blue-600 via-blue-500 to-blue-500 text-white shadow-[0_18px_38px_-18px_rgba(10,132,255,0.65)] hover:shadow-[0_24px_50px_-20px_rgba(10,132,255,0.65)] focus-visible:outline-blue-300 dark:focus-visible:outline-blue-400`;

const compactButtonBaseClass =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold leading-tight transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const primaryButtonCompactClass =
  `${compactButtonBaseClass} border border-transparent bg-blue-600 text-white shadow-[0_12px_25px_-18px_rgba(37,99,235,0.6)] hover:bg-blue-500 focus-visible:outline-blue-300 dark:focus-visible:outline-blue-400`;

export const ghostButtonClass =
  `${buttonBaseClass} border border-slate-200/80 bg-white/70 text-slate-900 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.5)] hover:bg-slate-50/80 focus-visible:outline-blue-300 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-[0_12px_28px_-24px_rgba(2,6,23,0.7)] dark:hover:bg-slate-800/70 dark:focus-visible:outline-blue-400`;

export const ghostButtonCompactClass =
  `${compactButtonBaseClass} border border-slate-200/80 bg-white text-slate-900 shadow-[0_10px_22px_-20px_rgba(15,23,42,0.45)] hover:bg-slate-100 focus-visible:outline-blue-300 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_10px_22px_-20px_rgba(2,6,23,0.7)] dark:hover:bg-slate-800/90 dark:focus-visible:outline-blue-400`;

const pillBaseClass =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold';

export const pillVariants = {
  accent: `${pillBaseClass} bg-blue-100/80 text-blue-600 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-500/30`,
  warning: `${pillBaseClass} bg-amber-100/80 text-amber-600 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/30`,
  danger: `${pillBaseClass} bg-red-100/80 text-red-600 ring-1 ring-inset ring-red-200/70 dark:bg-red-500/20 dark:text-red-200 dark:ring-red-500/30`,
  success: `${pillBaseClass} bg-emerald-100/80 text-emerald-600 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-500/30`,
  muted: `${pillBaseClass} bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200`
} as const;

export const cardClass =
  'rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-[0_34px_68px_-44px_rgba(15,23,42,0.75)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 motion-safe:animate-[fade-in-scale_0.45s_ease-out] dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_34px_68px_-44px_rgba(2,6,23,0.85)]';

export const timelineItemClass =
  'grid gap-2 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_30px_65px_-50px_rgba(15,23,42,0.7)] ring-1 ring-white/40 backdrop-blur-2xl transition-all duration-200 motion-safe:animate-[fade-in-scale_0.45s_ease-out] dark:border-slate-700/60 dark:bg-slate-900/60 dark:ring-slate-700/60 dark:shadow-[0_30px_65px_-50px_rgba(2,6,23,0.85)]';

export const inputClass =
  'w-full rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-slate-900 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.55)] transition-all duration-200 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:shadow-[0_20px_40px_-32px_rgba(2,6,23,0.7)] dark:focus-visible:outline-blue-400';

export const formFieldClass = 'grid gap-2';

export const mutedTextClass = 'text-sm text-slate-600 dark:text-slate-300';
export const tertiaryTextClass = 'text-sm text-slate-500 dark:text-slate-400';

export const emptyStateClass =
  'rounded-3xl border border-dashed border-slate-300/70 bg-white/60 px-6 py-12 text-center text-slate-600 backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-900/50 dark:text-slate-300';

export const statusPillClass = (status: MaintenanceStatus) => {
  if (status === 'overdue') {
    return pillVariants.danger;
  }

  if (status === 'due_soon') {
    return pillVariants.warning;
  }

  return pillVariants.accent;
};
