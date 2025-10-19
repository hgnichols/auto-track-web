import { submitVehicleAction } from './actions';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData } from '../../lib/repository';
import { redirect } from 'next/navigation';
import {
  cardClass,
  formFieldClass,
  inputClass,
  mutedTextClass,
  pillVariants,
  primaryButtonClass
} from '../../lib/ui';

export default async function OnboardingPage() {
  const deviceId = requireDeviceId('/onboarding');
  const existing = await getDashboardData(deviceId);

  if (existing?.vehicle) {
    redirect('/');
  }

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
        <form action={submitVehicleAction} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={formFieldClass}>
              <label htmlFor="year" className="text-sm font-medium text-slate-600">
                Year
              </label>
              <input
                id="year"
                name="year"
                type="number"
                min="1970"
                max="2099"
                placeholder="e.g. 2019"
                className={inputClass}
              />
            </div>
            <div className={formFieldClass}>
              <label htmlFor="make" className="text-sm font-medium text-slate-600">
                Make *
              </label>
              <input id="make" name="make" type="text" required placeholder="e.g. Toyota" className={inputClass} />
            </div>
            <div className={formFieldClass}>
              <label htmlFor="model" className="text-sm font-medium text-slate-600">
                Model *
              </label>
              <input id="model" name="model" type="text" required placeholder="e.g. Camry" className={inputClass} />
            </div>
            <div className={formFieldClass}>
              <label htmlFor="vin" className="text-sm font-medium text-slate-600">
                VIN
              </label>
              <input id="vin" name="vin" type="text" placeholder="Optional" className={inputClass} />
            </div>
            <div className={formFieldClass}>
              <label htmlFor="current_mileage" className="text-sm font-medium text-slate-600">
                Current mileage
              </label>
              <input
                id="current_mileage"
                name="current_mileage"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 54000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className={primaryButtonClass}>
              Save vehicle
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
