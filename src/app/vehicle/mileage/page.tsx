import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { getVehicleByDevice } from '../../../lib/repository';
import { cardClass, ghostButtonCompactClass, mutedTextClass } from '../../../lib/ui';
import { UpdateMileageForm } from './update-form';

export default async function UpdateMileagePage() {
  const deviceId = requireDeviceId('/vehicle/mileage');
  const vehicle = await getVehicleByDevice(deviceId);

  if (!vehicle) {
    redirect('/onboarding');
  }

  const currentMileage =
    typeof vehicle.current_mileage === 'number' && Number.isFinite(vehicle.current_mileage)
      ? vehicle.current_mileage
      : null;

  const lastConfirmedLabel =
    vehicle.last_mileage_confirmed_at !== null
      ? new Date(vehicle.last_mileage_confirmed_at).toLocaleDateString()
      : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <Link href="/" className={ghostButtonCompactClass}>
          Back to dashboard
        </Link>
      </div>

      <section className={`${cardClass} grid gap-6`}>
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Update mileage</h1>
          <p className={mutedTextClass}>
            Keep your reminders accurate by updating your odometer reading whenever you like.
          </p>
          {lastConfirmedLabel && (
            <p className="text-sm text-slate-500">
              Last confirmed: {lastConfirmedLabel} ({currentMileage?.toLocaleString() ?? 'not set'} miles)
            </p>
          )}
        </header>

        <UpdateMileageForm defaultMileage={currentMileage} />
      </section>
    </div>
  );
}
