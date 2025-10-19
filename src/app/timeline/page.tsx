import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData } from '../../lib/repository';
import { buildTimeline } from '../../lib/dashboard-helpers';
import {
  emptyStateClass,
  mutedTextClass,
  pillVariants,
  statusPillClass,
  timelineItemClass
} from '../../lib/ui';

export default async function TimelinePage() {
  const deviceId = requireDeviceId('/timeline');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules, logs } = data;
  const entries = buildTimeline(schedules, logs, vehicle);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Maintenance timeline</h1>
        <p className={`${mutedTextClass} text-base`}>
          Track what was done and see what&apos;s coming up next.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className={emptyStateClass}>
          <p className="text-sm text-slate-600">
            You have no maintenance records yet. Log a service to get started.
          </p>
        </div>
      ) : (
        <section className="grid gap-5">
          {entries.map((entry) => {
            if (entry.type === 'upcoming') {
              const statusLabel =
                entry.status === 'overdue'
                  ? 'Overdue'
                  : entry.status === 'due_soon'
                  ? 'Due soon'
                  : 'On track';
              const accentClass =
                entry.status === 'overdue'
                  ? 'border-red-200/70 bg-red-50/80'
                  : entry.status === 'due_soon'
                  ? 'border-amber-200/70 bg-amber-50/80'
                  : 'border-blue-200/70 bg-blue-50/80';

              return (
                <article key={entry.id} className={`${timelineItemClass} ${accentClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">{entry.title}</h2>
                    <span className={statusPillClass(entry.status)}>{statusLabel}</span>
                  </div>
                  <p className={mutedTextClass}>
                    {entry.dateLabel ? `Target date: ${entry.dateLabel}` : 'No due date set'}
                  </p>
                  {entry.mileageLabel && (
                    <p className={mutedTextClass}>Target mileage: {entry.mileageLabel}</p>
                  )}
                </article>
              );
            }

            return (
              <article key={entry.id} className={timelineItemClass}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">{entry.title}</h2>
                  <span className={pillVariants.accent}>Completed</span>
                </div>
                <p className={mutedTextClass}>
                  {entry.dateLabel}
                  {entry.mileageLabel ? ` • ${entry.mileageLabel}` : ''}
                </p>
                {entry.costLabel && <p className={mutedTextClass}>Cost: {entry.costLabel}</p>}
                {entry.notes && <p className={`${mutedTextClass} mt-2`}>{entry.notes}</p>}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
