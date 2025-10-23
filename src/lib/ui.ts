import type { MaintenanceStatus } from './types';

const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export const primaryButtonClass =
  `${buttonBaseClass} border border-transparent bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_14px_30px_rgba(10,132,255,0.35)] hover:-translate-y-px hover:shadow-[0_18px_38px_rgba(10,132,255,0.35)] focus-visible:outline-blue-400`;

const compactButtonBaseClass =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold leading-tight transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const primaryButtonCompactClass =
  `${compactButtonBaseClass} border border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-400`;

export const ghostButtonClass =
  `${buttonBaseClass} border border-slate-200/70 bg-white/70 text-slate-900 shadow-none hover:-translate-y-px hover:bg-white focus-visible:outline-blue-400`;

export const ghostButtonCompactClass =
  `${compactButtonBaseClass} border border-slate-200/70 bg-white text-slate-900 shadow-none hover:bg-slate-100 focus-visible:outline-blue-400`;

const pillBaseClass =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold';

export const pillVariants = {
  accent: `${pillBaseClass} bg-blue-100 text-blue-600 ring-1 ring-inset ring-blue-200`,
  warning: `${pillBaseClass} bg-amber-100 text-amber-600 ring-1 ring-inset ring-amber-200`,
  danger: `${pillBaseClass} bg-red-100 text-red-600 ring-1 ring-inset ring-red-200`,
  success: `${pillBaseClass} bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-200`,
  muted: `${pillBaseClass} bg-slate-200 text-slate-600`
} as const;

export const cardClass =
  'rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-soft backdrop-blur-3xl backdrop-saturate-150';

export const timelineItemClass =
  'grid gap-2 rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-soft backdrop-blur';

export const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:opacity-60';

export const formFieldClass = 'grid gap-2';

export const mutedTextClass = 'text-sm text-slate-500';
export const tertiaryTextClass = 'text-sm text-slate-400';

export const emptyStateClass =
  'rounded-3xl border border-dashed border-slate-200/70 bg-white/70 px-6 py-12 text-center text-slate-500';

export const statusPillClass = (status: MaintenanceStatus) => {
  if (status === 'overdue') {
    return pillVariants.danger;
  }

  if (status === 'due_soon') {
    return pillVariants.warning;
  }

  return pillVariants.accent;
};
