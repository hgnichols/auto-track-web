'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

import ThemeToggle from './theme-toggle';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/service/new', label: 'Add Service' }
];

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith('/onboarding');

  const navLinkClasses =
    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300/70 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 dark:focus-visible:outline-blue-400/60';
  const activeNavLinkClasses =
    'bg-blue-100/90 text-blue-600 shadow-[0_10px_22px_-16px_rgba(37,99,235,0.9)] ring-1 ring-inset ring-blue-200/80 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-400/40';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-40%] z-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.24),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] bottom-[-45%] z-0 h-[520px] rounded-[50%] bg-[radial-gradient(circle,_rgba(14,116,144,0.18),_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(30,64,175,0.18),_transparent_72%)]"
      />
      {hideNav && (
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
      )}
      {!hideNav && (
        <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200/80 bg-white/80 px-6 py-4 shadow-[0_24px_65px_-35px_rgba(15,23,42,0.55)] backdrop-blur-2xl backdrop-saturate-150 motion-safe:animate-[fade-in-down_0.4s_ease-out] dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_24px_65px_-35px_rgba(2,6,23,0.7)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-lg font-semibold tracking-tight text-slate-900 sm:flex-row sm:items-baseline sm:gap-2">
            <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              AutoTrack
            </Link>
            <span className="text-xs font-normal text-slate-500 sm:text-sm dark:text-slate-400">
              Maintenance made simple
            </span>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-3">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(navLinkClasses, isActive && activeNavLinkClasses)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <ThemeToggle />
          </div>
        </header>
      )}

      <main className="relative z-10 mx-auto grid w-full max-w-[1040px] flex-1 gap-10 px-4 pt-12 pb-16 motion-safe:animate-[fade-in-up_0.55s_ease-out] sm:px-6">
        {children}
      </main>
    </div>
  );
}
