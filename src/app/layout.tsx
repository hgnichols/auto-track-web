import type { Metadata } from 'next';
import './globals.css';
import AppShell from '../components/app-shell';

export const metadata: Metadata = {
  title: 'AutoTrack | Maintenance made simple',
  description:
    'AutoTrack makes it effortless to track car maintenance, log service history, and stay ahead of reminders.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
