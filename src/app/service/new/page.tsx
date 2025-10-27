import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { getDashboardData } from '../../../lib/repository';
import { submitServiceAction } from './actions';
import { getUpcomingServices, nextReminderLabel, reminderPreviewDate } from '../../../lib/dashboard-helpers';
import ServiceTypeField from '../../../components/service-type-field';
import {
  cardClass,
  formFieldClass,
  ghostButtonClass,
  inputClass,
  mutedTextClass,
  primaryButtonClass,
  statusPillClass
} from '../../../lib/ui';

export default async function NewServicePage() {
  const deviceId = await requireDeviceId('/service/new');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules } = data;
  const upcoming = getUpcomingServices(schedules, vehicle);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-12 sm:py-16">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Log service</h1>
        <p className={`${mutedTextClass} text-base`}>
          Keep your history up to date. We will update reminders automatically.
        </p>
      </header>

      <section className={`${cardClass} grid gap-6`}>
        <form action={submitServiceAction} className="grid gap-6">
          <ServiceTypeField schedules={schedules} />

          <div className={formFieldClass}>
            <label htmlFor="service_date" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Service date
            </label>
            <input id="service_date" name="service_date" type="date" required className={inputClass} />
          </div>

          <div className={formFieldClass}>
            <label htmlFor="mileage" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Mileage
            </label>
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
              className={inputClass}
            />
          </div>

          <div className={formFieldClass}>
            <label htmlFor="cost" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Cost
            </label>
            <input
              id="cost"
              name="cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          <div className={formFieldClass}>
            <label htmlFor="notes" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Add any details you want to remember"
              className={`${inputClass} min-h-[120px] resize-y`}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Link href="/" className={ghostButtonClass}>
              Cancel
            </Link>
            <button
              type="submit"
              className={`${primaryButtonClass} rounded-2xl px-5 py-2.5 shadow-[0_10px_24px_rgba(10,132,255,0.25)] hover:shadow-[0_14px_30px_rgba(10,132,255,0.25)]`}
            >
              Save log
            </button>
          </div>
        </form>
      </section>

      <section className={`${cardClass} grid gap-4`}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reminder preview</h2>
          <Link href="/timeline" className={ghostButtonClass}>
            View timeline
          </Link>
        </header>

        <ul className="grid gap-3">
          {upcoming.map((item) => {
            const reminderDate = reminderPreviewDate(item);
            const reminderMessage = nextReminderLabel(item);
            const statusLabel =
              item.status === 'overdue'
                ? 'Overdue'
                : item.status === 'due_soon'
                ? 'Due soon'
                : 'On track';

            return (
              <li
                key={item.schedule.id}
                className="grid gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 ring-1 ring-white/40 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700/60 dark:shadow-[0_20px_45px_-32px_rgba(2,6,23,0.75)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-900 dark:text-slate-100">{item.schedule.service_name}</strong>
                  <span className={statusPillClass(item.status)}>{statusLabel}</span>
                </div>
                <span className={mutedTextClass}>
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
                {reminderMessage && <span className={mutedTextClass}>{reminderMessage}</span>}
                {reminderDate && (
                  <span className={mutedTextClass}>Reminder heads-up around {reminderDate}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
