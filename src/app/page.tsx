import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../lib/device';
import { getDashboardData } from '../lib/repository';
import {
  getLastService,
  getUpcomingServices,
  nextReminderLabel,
  pickNextDueService
} from '../lib/dashboard-helpers';
import clsx from 'clsx';

export default async function DashboardPage() {
  const deviceId = requireDeviceId('/');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules, logs } = data;
  const upcomingServices = getUpcomingServices(schedules, vehicle);
  const nextService = pickNextDueService(upcomingServices);
  const lastService = getLastService(logs);

  const reminderCandidates = upcomingServices.filter(
    (item) => item.status === 'due_soon' || item.status === 'overdue'
  );

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      {reminderCandidates.length > 0 && (
        <section className="alert alert--warning">
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>Upcoming maintenance</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#fef3c7' }}>
            {reminderCandidates.map((item) => (
              <li key={item.schedule.id}>
                <strong>{item.schedule.service_name}</strong>{' '}
                {item.dueDateLabel ? `due ${item.dueDateLabel}` : ''}
                {item.milesUntilDue !== null ? ` • ${item.milesUntilDue.toLocaleString()} miles left` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-two" style={{ gap: '1.5rem' }}>
        <div className="card" style={{ display: 'grid', gap: '1rem' }}>
          <header>
            <div className="pill pill--accent">Your vehicle</div>
            <h1 style={{ marginTop: '0.65rem', marginBottom: '0.35rem' }}>
              {vehicle.year ? `${vehicle.year} ` : ''}
              {vehicle.make} {vehicle.model}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {vehicle.current_mileage !== null
                ? `${vehicle.current_mileage.toLocaleString()} miles`
                : 'Mileage not set yet'}
            </p>
          </header>

          <footer style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/service/new" className="cta-button">
              + Log Service
            </Link>
            <Link href="/timeline" className="cta-button cta-button--ghost">
              View Timeline
            </Link>
          </footer>
        </div>

        <div className="card" style={{ display: 'grid', gap: '1rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Next up</h2>
            {nextService && (
              <span
                className={clsx(
                  'pill',
                  nextService.status === 'overdue' && 'pill--danger',
                  nextService.status === 'due_soon' && 'pill--warning'
                )}
              >
                {nextService.status === 'overdue'
                  ? 'Overdue'
                  : nextService.status === 'due_soon'
                  ? 'Due soon'
                  : 'On track'}
              </span>
            )}
          </header>

          {nextService ? (
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <h3 style={{ margin: 0 }}>{nextService.schedule.service_name}</h3>
              {nextService.dueDateLabel && (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Target date: {nextService.dueDateLabel}
                </p>
              )}
              {nextService.milesUntilDue !== null && (
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {nextService.milesUntilDue <= 0
                    ? 'Mileage threshold reached'
                    : `${nextService.milesUntilDue.toLocaleString()} miles remaining`}
                </p>
              )}
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                {nextReminderLabel(nextService) ?? 'Stay on track'}
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <p style={{ margin: 0 }}>Add your first service to see reminders here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Last service</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
              See the latest work done on your car.
            </p>
          </div>
          <Link href="/service/new" className="cta-button cta-button--ghost">
            Log another
          </Link>
        </header>

        {lastService ? (
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <strong>{lastService.service_name}</strong>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Completed on {new Date(lastService.service_date).toLocaleDateString()}
              {lastService.mileage !== null
                ? ` • ${lastService.mileage.toLocaleString()} miles`
                : ''}
            </p>
            {lastService.notes && (
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
                “{lastService.notes}”
              </p>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p style={{ margin: 0 }}>
              No services logged yet. Tap “Log Service” to add your first maintenance record.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
