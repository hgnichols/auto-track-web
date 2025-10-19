import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { getDashboardData } from '../../../lib/repository';
import { submitServiceAction } from './actions';
import { getUpcomingServices } from '../../../lib/dashboard-helpers';

export default async function NewServicePage() {
  const deviceId = requireDeviceId('/service/new');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules } = data;
  const upcoming = getUpcomingServices(schedules, vehicle);

  return (
    <div className="grid" style={{ gap: '1.5rem', maxWidth: 680, margin: '0 auto' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h1 style={{ margin: 0 }}>Log service</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Keep your history up to date. We will update reminders automatically.
        </p>
      </header>

      <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
        <form action={submitServiceAction} className="form">
          <div className="form-field">
            <label htmlFor="schedule_id">Service</label>
            <select id="schedule_id" name="schedule_id" required defaultValue="">
              <option value="" disabled>
                Select service type
              </option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.service_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="service_date">Service date</label>
            <input id="service_date" name="service_date" type="date" required />
          </div>

          <div className="form-field">
            <label htmlFor="mileage">Mileage</label>
            <input
              id="mileage"
              name="mileage"
              type="number"
              min="0"
              step="1"
              placeholder={
                vehicle.current_mileage !== null
                  ? `~${vehicle.current_mileage.toLocaleString()}`
                  : 'Optional'
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="cost">Cost</label>
            <input id="cost" name="cost" type="number" min="0" step="0.01" placeholder="Optional" />
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Add any details you want to remember"
            />
          </div>

          <div className="form-actions">
            <Link href="/" className="cta-button cta-button--ghost">
              Cancel
            </Link>
            <button type="submit" className="cta-button">
              Save log
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ display: 'grid', gap: '0.75rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Reminder preview</h2>
          <Link href="/timeline" className="cta-button cta-button--ghost">
            View timeline
          </Link>
        </header>

        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
          {upcoming.map((item) => (
            <li
              key={item.schedule.id}
              style={{
                display: 'grid',
                gap: '0.25rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-muted)'
              }}
            >
              <strong>{item.schedule.service_name}</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {item.dueDateLabel ? `Next target: ${item.dueDateLabel}. ` : ''}
                {item.milesUntilDue !== null
                  ? `${item.milesUntilDue.toLocaleString()} miles remaining.`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
