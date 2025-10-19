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

  return (
    <div className="app-container">
      {!hideNav && (
        <header className="nav-bar">
          <div>
            <Link href="/">
              <strong>AutoTrack</strong>
            </Link>
          </div>

          <nav className="nav-links">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx('nav-link', isActive && 'nav-link--active')}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>
      )}

      <main className="main-content" style={{ padding: '1.5rem', width: '100%', maxWidth: 960, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
