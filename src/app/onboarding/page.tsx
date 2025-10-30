import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData, getVehicleCatalogYears } from '../../lib/repository';
import { cardClass, mutedTextClass } from '../../lib/ui';
import { VehicleForm } from './vehicle-form';

type OnboardingSearchParams = Record<string, string | string[] | undefined>;

type OnboardingPageProps = {
  searchParams?: OnboardingSearchParams | Promise<OnboardingSearchParams>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const deviceId = await requireDeviceId('/onboarding');
  const params = ((await searchParams) ?? {}) as OnboardingSearchParams;
  const modeParam = params.mode;
  const mode = Array.isArray(modeParam) ? modeParam[0] ?? null : modeParam ?? null;
  const isAddFlow = mode === 'add';
  const redirectParam = params.redirect;
  const requestedReturn = Array.isArray(redirectParam)
    ? redirectParam[0] ?? null
    : redirectParam ?? null;
  const safeReturnPath =
    typeof requestedReturn === 'string' && requestedReturn.startsWith('/') ? requestedReturn : '/';

  const existing = await getDashboardData(deviceId);

  if (!isAddFlow && existing.vehicles.length > 0) {
    redirect('/');
  }

  const years = await getVehicleCatalogYears();
  const hasCatalog = years.length > 0;
  const heroTitle = isAddFlow ? 'Add another vehicle' : 'Set up your vehicle';
  const heroBadge = isAddFlow ? 'Garage upgrade' : 'Welcome to AutoTrack';
  const heroDescription = isAddFlow
    ? 'Pick another ride and we’ll load a fresh set of maintenance schedules tailored to it.'
    : 'Add your car once and we’ll preload smart maintenance reminders so you can focus on the road ahead.';

  const heroCardClass = `${cardClass} relative overflow-hidden border-transparent bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(59,130,246,0.05)_45%,_rgba(255,255,255,0.92)_100%)] px-8 py-10 text-center shadow-[0_25px_65px_-45px_rgba(59,130,246,0.55)] dark:border-slate-700/60 dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_rgba(15,23,42,0.95)_78%)] dark:text-slate-100 dark:shadow-[0_28px_70px_-46px_rgba(15,23,42,0.9)]`;
  const panelCardClass = `${cardClass} grid gap-6 bg-white/80 ring-1 ring-white/40 dark:bg-slate-900/60 dark:ring-slate-700/60`;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-12 sm:py-16">
      <section className={heroCardClass}>
        <div className="relative z-10 grid gap-5">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 shadow-[0_10px_25px_-20px_rgba(37,99,235,0.55)] dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
            {heroBadge}
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.35rem]">
              {heroTitle}
            </h1>
            <p className={`${mutedTextClass} mx-auto max-w-xl text-base sm:text-lg`}>{heroDescription}</p>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[10%] bottom-[-45%] h-64 rounded-[50%] bg-[radial-gradient(circle,_rgba(56,189,248,0.22),_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(59,130,246,0.22),_transparent_75%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[30%] left-[8%] h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.28),_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(99,102,241,0.24),_transparent_74%)]"
        />
      </section>

      <section className={panelCardClass}>
        {hasCatalog ? (
          <VehicleForm years={years} returnPath={safeReturnPath} />
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Vehicle catalog unavailable
            </h2>
            <p className={mutedTextClass}>
              We could not load the vehicle catalog. Run the generator script and seed the database,
              then refresh to continue onboarding.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
