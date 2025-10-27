import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../lib/device';
import { getDashboardData } from '../lib/repository';
import { getLastService, getUpcomingServices, nextReminderLabel, pickNextDueService } from '../lib/dashboard-helpers';
import {
  cardClass,
  ghostButtonClass,
  primaryButtonClass,
  pillVariants,
  mutedTextClass,
  tertiaryTextClass,
  statusPillClass,
  emptyStateClass
} from '../lib/ui';

export default async function DashboardPage() {
  const deviceId = await requireDeviceId('/');
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

  const dueSoonCount = reminderCandidates.filter((item) => item.status === 'due_soon').length;
  const overdueCount = reminderCandidates.filter((item) => item.status === 'overdue').length;

  const reminderSummaryParts: string[] = [];
  if (overdueCount > 0) {
    reminderSummaryParts.push(`${overdueCount} overdue`);
  }
  if (dueSoonCount > 0) {
    reminderSummaryParts.push(`${dueSoonCount} due soon`);
  }

  const reminderSummary = reminderSummaryParts.join(' • ');

  const mileageLabel =
    vehicle.current_mileage !== null
      ? `${vehicle.current_mileage.toLocaleString()} miles on the odometer`
      : 'Mileage not set yet';

  const nextServiceDetailParts: string[] = [];
  const nextServiceDueDate = nextService?.dueDateLabel;
  if (nextServiceDueDate) {
    nextServiceDetailParts.push(`Target ${nextServiceDueDate}`);
  }

  const nextServiceMiles = nextService?.milesUntilDue;
  if (nextServiceMiles !== null && nextServiceMiles !== undefined) {
    nextServiceDetailParts.push(
      nextServiceMiles <= 0
        ? 'Mileage threshold reached'
        : `${nextServiceMiles.toLocaleString()} miles remaining`
    );
  }

  const nextServiceMeta = nextService
    ? nextReminderLabel(nextService) ?? (nextServiceDetailParts.join(' • ') || 'Stay on track')
    : 'Add a maintenance schedule to start receiving reminders.';

  const nextServiceSecondary = nextService
    ? nextServiceDetailParts.length > 0
      ? nextServiceDetailParts.join(' • ')
      : undefined
    : undefined;

  const lastServiceDate = lastService
    ? new Date(lastService.service_date).toLocaleDateString()
    : null;

  const lastServiceMeta = lastService
    ? `Completed on ${lastServiceDate}${
        lastService.mileage !== null ? ` • ${lastService.mileage.toLocaleString()} miles` : ''
      }`
    : 'Log a service to build history and personalized reminders.';

  const heroCardClass = `${cardClass} relative overflow-hidden bg-[linear-gradient(155deg,_rgba(14,165,233,0.18),_rgba(255,255,255,0.94))] ring-1 ring-white/40 dark:bg-[linear-gradient(155deg,_rgba(37,99,235,0.2),_rgba(15,23,42,0.92))] dark:ring-slate-700/60`;
  const panelCardClass = `${cardClass} grid gap-6 bg-white/75 ring-1 ring-white/40 dark:bg-slate-900/60 dark:ring-slate-700/60`;

  return (
    <div className="grid gap-10">
      {reminderCandidates.length > 0 && (
        <section className="grid gap-4 rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white/90 to-amber-100/70 p-7 text-slate-700 shadow-[0_30px_70px_-50px_rgba(217,119,6,0.65)] ring-1 ring-white/30 dark:border-amber-400/40 dark:from-amber-500/15 dark:via-slate-950/60 dark:to-amber-500/10 dark:text-amber-100 dark:shadow-[0_30px_70px_-50px_rgba(2,6,23,0.82)] dark:ring-slate-700/60">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Upcoming maintenance</h2>
            {reminderSummary && (
              <p className={`${mutedTextClass} mt-1 text-base sm:text-sm`}>{reminderSummary}</p>
            )}
          </div>
          <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-200">
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

      <section className={heroCardClass}>
        <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className={pillVariants.accent}>Your vehicle</div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              {vehicle.year ? `${vehicle.year} ` : ''}
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">{mileageLabel}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/service/new" className={primaryButtonClass}>
              + Log Service
            </Link>
            <Link href="/vehicle/mileage" className={ghostButtonClass}>
              Update Mileage
            </Link>
            <Link href="/timeline" className={ghostButtonClass}>
              View Timeline
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-9 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1 rounded-2xl border border-white/50 bg-white/75 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Next reminder
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {nextService ? nextService.schedule.service_name : 'No service scheduled'}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-300">{nextServiceMeta}</span>
            {nextServiceSecondary && <span className={tertiaryTextClass}>{nextServiceSecondary}</span>}
          </div>
          <div className="grid gap-1 rounded-2xl border border-white/50 bg-white/75 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Last service
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {lastService ? lastService.service_name : 'Not logged yet'}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-300">{lastServiceMeta}</span>
            {lastService?.notes && <span className={tertiaryTextClass}>“{lastService.notes}”</span>}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[18%] -bottom-[40%] h-[420px] w-[420px] translate-y-[20%] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.22),_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(59,130,246,0.18),_transparent_74%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[12%] -top-[24%] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.28),_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(99,102,241,0.22),_transparent_74%)]"
        />
      </section>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className={panelCardClass}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Next up</h2>
              <p className={mutedTextClass}>
                {nextService
                  ? 'Your next recommended maintenance task.'
                  : 'Add a schedule to start receiving proactive reminders.'}
              </p>
            </div>
            {nextService && (
              <span className={statusPillClass(nextService.status)}>
                {nextService.status === 'overdue'
                  ? 'Overdue'
                  : nextService.status === 'due_soon'
                  ? 'Due soon'
                  : 'On track'}
              </span>
            )}
          </header>

          {nextService ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {nextService.schedule.service_name}
              </h3>
              <p className={mutedTextClass}>{nextReminderLabel(nextService) ?? 'Stay on track'}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-300">
                {nextService.dueDateLabel && <li>Target date: {nextService.dueDateLabel}</li>}
                {nextService.milesUntilDue !== null && (
                  <li>
                    {nextService.milesUntilDue <= 0
                      ? 'Mileage threshold reached'
                      : `${nextService.milesUntilDue.toLocaleString()} miles remaining`}
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className={emptyStateClass}>
              <p>Add your first service to see reminders here.</p>
            </div>
          )}
        </section>

        <section className={panelCardClass}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Last service</h2>
              <p className={mutedTextClass}>A quick snapshot of your most recent maintenance.</p>
            </div>
            <Link href="/service/new" className={`${ghostButtonClass} whitespace-nowrap`}>
              Log another
            </Link>
          </header>

          {lastService ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{lastService.service_name}</h3>
              <p className={mutedTextClass}>{lastServiceMeta}</p>
              {lastService.notes && <p className={`${tertiaryTextClass} italic`}>“{lastService.notes}”</p>}
            </div>
          ) : (
            <div className={emptyStateClass}>
              <p>No services logged yet. Tap “Log Service” to add your first maintenance record.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
