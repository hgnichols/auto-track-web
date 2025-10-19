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
  const deviceId = requireDeviceId('/service/new');
  const data = await getDashboardData(deviceId);

  if (!data) {
    redirect('/onboarding');
  }

  const { vehicle, schedules } = data;
  const upcoming = getUpcomingServices(schedules, vehicle);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-12 sm:py-16">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Log service</h1>
        <p className={`${mutedTextClass} text-base`}>
          Keep your history up to date. We will update reminders automatically.
        </p>
      </header>

      <section className={`${cardClass} grid gap-6`}>
        <form action={submitServiceAction} className="grid gap-6">
          <ServiceTypeField schedules={schedules} />

          <div className={formFieldClass}>
            <label htmlFor="service_date" className="text-sm font-medium text-slate-600">
              Service date
            </label>
            <input id="service_date" name="service_date" type="date" required className={inputClass} />
          </div>

          <div className={formFieldClass}>
            <label htmlFor="mileage" className="text-sm font-medium text-slate-600">
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
            <label htmlFor="cost" className="text-sm font-medium text-slate-600">
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
            <label htmlFor="notes" className="text-sm font-medium text-slate-600">
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
            <button type="submit" className={primaryButtonClass}>
              Save log
            </button>
          </div>
        </form>
      </section>

      <section className={`${cardClass} grid gap-4`}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Reminder preview</h2>
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
                className="grid gap-2 rounded-2xl bg-slate-100/80 p-4 text-sm text-slate-600"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-slate-900">{item.schedule.service_name}</strong>
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
