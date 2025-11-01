import Link from 'next/link';
import { redirect } from 'next/navigation';
import VehicleSwitcher from '../../components/vehicle-switcher';
import { requireDeviceId } from '../../lib/device';
import { getDashboardData } from '../../lib/repository';
import { buildTimeline } from '../../lib/dashboard-helpers';
import {
  emptyStateClass,
  ghostButtonCompactClass,
  mutedTextClass,
  pillVariants,
  statusPillClass,
  timelineItemClass
} from '../../lib/ui';
import { getActiveVehicleIdFromCookies } from '../../lib/vehicle-selection';

export default async function TimelinePage() {
  const deviceId = await requireDeviceId('/timeline');
  const onboardingRedirect = '/onboarding?mode=add&redirect=%2Ftimeline';
  const activeVehicleIdFromCookie = await getActiveVehicleIdFromCookies();
  const dashboardData = await getDashboardData(deviceId, activeVehicleIdFromCookie);

  if (dashboardData.vehicles.length === 0 || !dashboardData.activeVehicle) {
    redirect(onboardingRedirect);
  }

  const { vehicles, activeVehicle, schedules, logs } = dashboardData;
  const entries = buildTimeline(schedules, logs, activeVehicle);
  const vehicleLabel = `${activeVehicle.year ?? ''} ${activeVehicle.make} ${activeVehicle.model}`.trim();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Maintenance timeline</h1>
        <p className={`${mutedTextClass} text-base`}>
          Track what was done and see what&apos;s coming up next.
        </p>
        <VehicleSwitcher vehicles={vehicles} activeVehicleId={activeVehicle.id} returnPath="/timeline" />
        <p className={mutedTextClass}>
          Showing records for <span className="font-medium text-slate-800 dark:text-slate-100">{vehicleLabel}</span>.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className={emptyStateClass}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
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
              const statusDecorators =
                entry.status === 'overdue'
                  ? {
                      container:
                        'border-red-200/70 ring-1 ring-red-200/60 dark:border-red-500/40 dark:ring-red-500/25',
                      marker: 'bg-red-500 dark:bg-red-400',
                      title: 'text-red-900 dark:text-red-100'
                    }
                  : entry.status === 'due_soon'
                  ? {
                      container:
                        'border-amber-200/70 ring-1 ring-amber-200/60 dark:border-amber-500/40 dark:ring-amber-500/25',
                      marker: 'bg-amber-400 dark:bg-amber-300',
                      title: 'text-amber-900 dark:text-amber-100'
                    }
                  : {
                      container:
                        'border-blue-200/70 ring-1 ring-blue-200/60 dark:border-blue-500/40 dark:ring-blue-500/25',
                      marker: 'bg-blue-500 dark:bg-blue-400',
                      title: 'text-slate-900 dark:text-slate-100'
                    };

              return (
                <article key={entry.id} className={`${timelineItemClass} ${statusDecorators.container}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${statusDecorators.marker}`}
                      />
                      <h2 className={`text-lg font-semibold tracking-tight ${statusDecorators.title}`}>
                        {entry.title}
                      </h2>
                    </div>
                    <span className={statusPillClass(entry.status)}>{statusLabel}</span>
                  </div>
                  <p className={mutedTextClass}>
                    {entry.dateLabel ? `Target date: ${entry.dateLabel}` : 'No due date set'}
                  </p>
                  {entry.mileageLabel && (
                    <p className={mutedTextClass}>Target mileage: {entry.mileageLabel}</p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/schedule/${entry.scheduleId}/due-date?return=%2Ftimeline`}
                      className={ghostButtonCompactClass}
                    >
                      Adjust due date
                    </Link>
                  </div>
                </article>
              );
            }

            return (
              <article key={entry.id} className={timelineItemClass}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {entry.title}
                  </h2>
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
