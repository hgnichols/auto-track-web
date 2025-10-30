import Link from 'next/link';
import { redirect } from 'next/navigation';
import VehicleSwitcher from '../../../components/vehicle-switcher';
import { requireDeviceId } from '../../../lib/device';
import { getDashboardData } from '../../../lib/repository';
import { cardClass, ghostButtonCompactClass, mutedTextClass } from '../../../lib/ui';
import { getActiveVehicleIdFromCookies } from '../../../lib/vehicle-selection';
import { UpdateMileageForm } from './update-form';

export default async function UpdateMileagePage() {
  const deviceId = await requireDeviceId('/vehicle/mileage');
  const onboardingRedirect = '/onboarding?mode=add&redirect=%2Fvehicle%2Fmileage';
  const activeVehicleIdFromCookie = await getActiveVehicleIdFromCookies();
  const dashboardData = await getDashboardData(deviceId, activeVehicleIdFromCookie);

  if (dashboardData.vehicles.length === 0 || !dashboardData.activeVehicle) {
    redirect(onboardingRedirect);
  }

  const { vehicles, activeVehicle } = dashboardData;
  const currentMileage =
    typeof activeVehicle.current_mileage === 'number' && Number.isFinite(activeVehicle.current_mileage)
      ? activeVehicle.current_mileage
      : null;
  const lastConfirmedLabel =
    activeVehicle.last_mileage_confirmed_at !== null
      ? new Date(activeVehicle.last_mileage_confirmed_at).toLocaleDateString()
      : null;
  const vehicleLabel = `${activeVehicle.year ?? ''} ${activeVehicle.make} ${activeVehicle.model}`.trim();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className={ghostButtonCompactClass}>
          Back to dashboard
        </Link>
        <VehicleSwitcher
          vehicles={vehicles}
          activeVehicleId={activeVehicle.id}
          returnPath="/vehicle/mileage"
        />
      </div>

      <section className={`${cardClass} grid gap-6`}>
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Update mileage</h1>
          <p className={mutedTextClass}>
            Keep your reminders accurate by updating your odometer reading whenever you like.
          </p>
          <p className={mutedTextClass}>
            Updating <span className="font-medium text-slate-800 dark:text-slate-100">{vehicleLabel}</span>.
          </p>
          {lastConfirmedLabel && (
            <p className="text-sm text-slate-500">
              Last confirmed: {lastConfirmedLabel} ({currentMileage?.toLocaleString() ?? 'not set'} miles)
            </p>
          )}
        </header>

        <UpdateMileageForm defaultMileage={currentMileage} vehicleId={activeVehicle.id} />
      </section>
    </div>
  );
}
