import { redirect } from 'next/navigation';
import { SignInForm } from '../../components/auth/sign-in-form';
import { SignUpForm } from '../../components/auth/sign-up-form';
import { createServerSupabaseClient } from '../../lib/supabase/clients';

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveRedirectParam(searchParams?: Record<string, string | string[] | undefined>) {
  const candidate = searchParams?.redirect;
  const value = Array.isArray(candidate) ? candidate[0] : candidate ?? '/';

  if (typeof value !== 'string') {
    return '/';
  }

  return value.startsWith('/') ? value : '/';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = resolveRedirectParam(searchParams);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const fallback = redirectTo === '/login' ? '/' : redirectTo;
    redirect(fallback);
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-16 sm:px-6">
      <div className="grid gap-6 rounded-3xl border border-white/50 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_rgba(14,116,144,0.08)_45%,_rgba(255,255,255,0.94)_100%)] px-6 py-10 text-center shadow-[0_25px_75px_-40px_rgba(37,99,235,0.5)] backdrop-blur dark:border-slate-700/60 dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_rgba(12,74,110,0.16)_52%,_rgba(15,23,42,0.94)_100%)] dark:text-slate-100 dark:shadow-[0_25px_75px_-40px_rgba(2,6,23,0.8)] sm:px-12 sm:py-14">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100/70 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 shadow-[0_10px_25px_-20px_rgba(37,99,235,0.45)] dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
          AutoTrack
        </div>
        <div className="grid gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.35rem]">
            Sign in to stay on track
          </h1>
          <p className="mx-auto max-w-xl text-sm text-slate-600 dark:text-slate-300">
            AutoTrack keeps your garage organized with smart maintenance reminders and history
            logs. Sign in or create an account to pick up where you left off.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SignInForm redirectTo={redirectTo} />
        <SignUpForm redirectTo={redirectTo === '/' ? '/onboarding' : redirectTo} />
      </div>
    </div>
  );
}
