'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/service/new', label: 'Add Service' }
];

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith('/onboarding');

  const navLinkClasses =
    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-100/70 hover:text-slate-900';
  const activeNavLinkClasses = 'bg-blue-100 text-blue-600 ring-1 ring-inset ring-blue-200';

  return (
    <div className="flex min-h-screen flex-col">
      {!hideNav && (
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-white/60 bg-white/70 px-6 py-4 backdrop-blur-xl backdrop-saturate-150 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-lg font-semibold tracking-tight text-slate-900 sm:flex-row sm:items-baseline sm:gap-2">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              AutoTrack
            </Link>
            <span className="text-xs font-normal text-slate-500 sm:text-sm">
              Maintenance made simple
            </span>
          </div>

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
        </header>
      )}

      <main className="mx-auto grid w-full max-w-[1040px] flex-1 gap-10 px-4 pt-12 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
