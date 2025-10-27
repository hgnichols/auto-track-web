import type { Metadata } from 'next';
import './globals.css';
import AppShell from '../components/app-shell';
import { ThemeProvider } from '../components/theme-provider';

export const metadata: Metadata = {
  title: 'AutoTrack | Maintenance made simple',
  description:
    'AutoTrack makes it effortless to track car maintenance, log service history, and stay ahead of reminders.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen bg-app-gradient bg-fixed font-sans text-slate-900 antialiased dark:bg-app-gradient-dark dark:text-slate-100">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
