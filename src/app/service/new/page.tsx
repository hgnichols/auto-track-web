import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { getDashboardData } from '../../../lib/repository';
import { submitServiceAction } from './actions';
import { getUpcomingServices, nextReminderLabel, reminderPreviewDate } from '../../../lib/dashboard-helpers';
import ServiceTypeField from '../../../components/service-type-field';

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
          <ServiceTypeField schedules={schedules} />

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
          {upcoming.map((item) => {
            const reminderDate = reminderPreviewDate(item);
            const reminderMessage = nextReminderLabel(item);

            return (
              <li
                key={item.schedule.id}
                style={{
                  display: 'grid',
                  gap: '0.35rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-muted)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{item.schedule.service_name}</strong>
                  <span
                    className={`pill ${
                      item.status === 'overdue'
                        ? 'pill--danger'
                        : item.status === 'due_soon'
                        ? 'pill--warning'
                        : 'pill--accent'
                    }`}
                  >
                    {item.status === 'overdue'
                      ? 'Overdue'
                      : item.status === 'due_soon'
                      ? 'Due soon'
                      : 'On track'}
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {item.dueDateLabel
                    ? item.daysUntilDue !== null && item.daysUntilDue < 0
                      ? `Target date passed (${item.dueDateLabel})`
                      : `Next target: ${item.dueDateLabel}`
                    : 'No due date yet'}
                  {item.milesUntilDue !== null
                    ? item.milesUntilDue <= 0
                      ? ' • Mileage threshold reached'
                      : ` • ${item.milesUntilDue.toLocaleString()} miles remaining`
                    : ''}
                </span>
                {reminderMessage && (
                  <span style={{ color: 'var(--text-secondary)' }}>{reminderMessage}</span>
                )}
                {reminderDate && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Reminder heads-up around {reminderDate}
                  </span>
                )}
              </li>
            );
          })}
       </ul>
     </section>
    </div>
  );
}
