import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData } from '../../lib/repository';
import { buildTimeline } from '../../lib/dashboard-helpers';

export default async function TimelinePage() {
  const deviceId = requireDeviceId('/timeline');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules, logs } = data;
  const entries = buildTimeline(schedules, logs, vehicle);

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <header style={{ display: 'grid', gap: '0.25rem' }}>
        <h1 style={{ margin: 0 }}>Maintenance timeline</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Track what was done and see what&apos;s coming up next.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>You have no maintenance records yet. Log a service to get started.</p>
        </div>
      ) : (
        <section className="timeline">
          {entries.map((entry) => {
            if (entry.type === 'upcoming') {
              const pillClass =
                entry.status === 'overdue'
                  ? 'pill pill--danger'
                  : entry.status === 'due_soon'
                  ? 'pill pill--warning'
                  : 'pill pill--accent';
              const pillLabel =
                entry.status === 'overdue'
                  ? 'Overdue'
                  : entry.status === 'due_soon'
                  ? 'Due soon'
                  : 'On track';

              return (
                <article
                  key={entry.id}
                  className={`timeline-item timeline-item--upcoming ${entry.status}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{entry.title}</h2>
                    <span className={pillClass}>{pillLabel}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {entry.dateLabel ? `Target date: ${entry.dateLabel}` : 'No due date set'}
                  </p>
                  {entry.mileageLabel && (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Target mileage: {entry.mileageLabel}</p>
                  )}
                </article>
              );
            }

            return (
              <article key={entry.id} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{entry.title}</h2>
                  <span className="pill pill--accent">Completed</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {entry.dateLabel}
                  {entry.mileageLabel ? ` • ${entry.mileageLabel}` : ''}
                </p>
                {entry.costLabel && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Cost: {entry.costLabel}</p>
                )}
                {entry.notes && (
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>{entry.notes}</p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
