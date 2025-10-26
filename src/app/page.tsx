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

  const heroCardClass = `${cardClass} relative overflow-hidden bg-[linear-gradient(145deg,_rgba(10,132,255,0.12),_rgba(255,255,255,0.9))]`;
  const panelCardClass = `${cardClass} grid gap-6`;

  return (
    <div className="grid gap-10">
      {reminderCandidates.length > 0 && (
        <section className="grid gap-4 rounded-3xl border border-amber-200/70 bg-amber-50/90 p-7 text-slate-700 shadow-soft">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Upcoming maintenance</h2>
            {reminderSummary && (
              <p className={`${mutedTextClass} mt-1 text-base sm:text-sm`}>{reminderSummary}</p>
            )}
          </div>
          <ul className="grid gap-2 text-sm text-slate-600">
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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {vehicle.year ? `${vehicle.year} ` : ''}
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-base text-slate-500">{mileageLabel}</p>
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
          <div className="grid gap-1 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-inner backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Next reminder
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {nextService ? nextService.schedule.service_name : 'No service scheduled'}
            </span>
            <span className="text-sm text-slate-500">{nextServiceMeta}</span>
            {nextServiceSecondary && <span className={tertiaryTextClass}>{nextServiceSecondary}</span>}
          </div>
          <div className="grid gap-1 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-inner backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Last service
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {lastService ? lastService.service_name : 'Not logged yet'}
            </span>
            <span className="text-sm text-slate-500">{lastServiceMeta}</span>
            {lastService?.notes && <span className={tertiaryTextClass}>“{lastService.notes}”</span>}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[20%] -bottom-[45%] h-[420px] w-[420px] translate-y-[20%] rounded-full bg-[radial-gradient(circle,_rgba(10,132,255,0.18),_transparent_70%)]"
        />
      </section>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className={panelCardClass}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Next up</h2>
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
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {nextService.schedule.service_name}
              </h3>
              <p className={mutedTextClass}>{nextReminderLabel(nextService) ?? 'Stay on track'}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
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
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Last service</h2>
              <p className={mutedTextClass}>A quick snapshot of your most recent maintenance.</p>
            </div>
            <Link href="/service/new" className={`${ghostButtonClass} whitespace-nowrap`}>
              Log another
            </Link>
          </header>

          {lastService ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{lastService.service_name}</h3>
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
