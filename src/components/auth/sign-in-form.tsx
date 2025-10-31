'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../lib/supabase/clients';

type SignInFormProps = {
  redirectTo: string;
};

export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '').trim();

    if (!email || !password) {
      setErrorMessage('Enter your email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-3xl border border-blue-200/70 bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(37,99,235,0.35)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-[0_20px_50px_-30px_rgba(2,6,23,0.65)]"
    >
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign in to access your maintenance dashboard.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        Email
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/40"
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        Password
        <input
          required
          name="password"
          type="password"
          autoComplete="current-password"
          className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus-visible:border-blue-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-200/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/40"
          placeholder="Enter your password"
        />
      </label>

      {errorMessage && (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-400"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
