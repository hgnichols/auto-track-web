import { requireDeviceId } from '../../lib/device';
import { getDashboardData, getVehicleCatalogYears } from '../../lib/repository';
import { redirect } from 'next/navigation';
import { cardClass, mutedTextClass, pillVariants } from '../../lib/ui';
import { VehicleForm } from './vehicle-form';

export default async function OnboardingPage() {
  const deviceId = await requireDeviceId('/onboarding');
  const existing = await getDashboardData(deviceId);

  if (existing?.vehicle) {
    redirect('/');
  }

  const years = await getVehicleCatalogYears();
  const hasCatalog = years.length > 0;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-12 sm:py-16">
      <header className="grid gap-3 text-center">
        <div className={pillVariants.accent}>Welcome to AutoTrack</div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Set up your vehicle</h1>
        <p className={`${mutedTextClass} mx-auto max-w-xl text-base`}>
          Add your car once. We will preload smart maintenance reminders so you can stay on track.
        </p>
      </header>

      <section className={`${cardClass} grid gap-6`}>
        {hasCatalog ? (
          <VehicleForm years={years} />
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Vehicle catalog unavailable</h2>
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
