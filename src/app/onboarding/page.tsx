import { submitVehicleAction } from './actions';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData } from '../../lib/repository';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const deviceId = requireDeviceId('/onboarding');
  const existing = await getDashboardData(deviceId);

  if (existing?.vehicle) {
    redirect('/');
  }

  return (
    <div style={{ maxWidth: 640, margin: '3rem auto', display: 'grid', gap: '1.5rem' }}>
      <header style={{ textAlign: 'center', display: 'grid', gap: '0.5rem' }}>
        <div className="pill pill--accent">Welcome to AutoTrack</div>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Set up your vehicle</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Add your car once. We will preload smart maintenance reminders so you can stay on track.
        </p>
      </header>

      <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
        <form action={submitVehicleAction} className="form">
          <div className="grid" style={{ gap: '1rem' }}>
            <div className="form-field">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                name="year"
                type="number"
                min="1970"
                max="2099"
                placeholder="e.g. 2019"
              />
            </div>
            <div className="form-field">
              <label htmlFor="make">Make *</label>
              <input id="make" name="make" type="text" required placeholder="e.g. Toyota" />
            </div>
            <div className="form-field">
              <label htmlFor="model">Model *</label>
              <input id="model" name="model" type="text" required placeholder="e.g. Camry" />
            </div>
            <div className="form-field">
              <label htmlFor="vin">VIN</label>
              <input id="vin" name="vin" type="text" placeholder="Optional" />
            </div>
            <div className="form-field">
              <label htmlFor="current_mileage">Current mileage</label>
              <input
                id="current_mileage"
                name="current_mileage"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 54000"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="cta-button">
              Save vehicle
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
