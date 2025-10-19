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
  if (nextService?.dueDateLabel) {
    nextServiceDetailParts.push(`Target ${nextService.dueDateLabel}`);
  }
  if (nextService?.milesUntilDue !== null) {
    nextServiceDetailParts.push(
      nextService.milesUntilDue <= 0
        ? 'Mileage threshold reached'
        : `${nextService.milesUntilDue.toLocaleString()} miles remaining`
    );
  }

  const nextServiceMeta = nextService
    ? nextReminderLabel(nextService) ?? nextServiceDetailParts.join(' • ') || 'Stay on track'
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

  return (
    <div className="dashboard-stack">
      {reminderCandidates.length > 0 && (
        <section className="notice notice--warning">
          <div>
            <h2 className="notice-title">Upcoming maintenance</h2>
            {reminderSummary && (
              <p className="text-secondary" style={{ margin: '0.25rem 0 0' }}>
                {reminderSummary}
              </p>
            )}
          </div>
          <ul className="notice-list">
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

      <section className="card dashboard-hero">
        <div className="dashboard-hero__header">
          <div>
            <div className="pill pill--accent">Your vehicle</div>
            <h1 className="hero-title">
              {vehicle.year ? `${vehicle.year} ` : ''}
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="hero-subtitle">{mileageLabel}</p>
          </div>

          <div className="hero-actions">
            <Link href="/service/new" className="cta-button">
              + Log Service
            </Link>
            <Link href="/timeline" className="cta-button cta-button--ghost">
              View Timeline
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-block">
            <span className="stat-label">Next reminder</span>
            <span className="stat-value">
              {nextService ? nextService.schedule.service_name : 'No service scheduled'}
            </span>
            <span className="stat-meta">{nextServiceMeta}</span>
            {nextServiceSecondary && <span className="text-tertiary">{nextServiceSecondary}</span>}
          </div>
          <div className="stat-block">
            <span className="stat-label">Last service</span>
            <span className="stat-value">
              {lastService ? lastService.service_name : 'Not logged yet'}
            </span>
            <span className="stat-meta">{lastServiceMeta}</span>
            {lastService?.notes && <span className="text-tertiary">“{lastService.notes}”</span>}
          </div>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="card panel">
          <header className="panel-header">
            <div>
              <h2 className="panel-title">Next up</h2>
              <p className="panel-subtitle">
                {nextService
                  ? 'Your next recommended maintenance task.'
                  : 'Add a schedule to start receiving proactive reminders.'}
              </p>
            </div>
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
            <div className="panel-body">
              <h3 className="panel-heading">{nextService.schedule.service_name}</h3>
              <p className="muted">{nextReminderLabel(nextService) ?? 'Stay on track'}</p>
              <ul className="detail-list">
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
            <div className="empty-state">
              <p>Add your first service to see reminders here.</p>
            </div>
          )}
        </section>

        <section className="card panel">
          <header className="panel-header">
            <div>
              <h2 className="panel-title">Last service</h2>
              <p className="panel-subtitle">A quick snapshot of your most recent maintenance.</p>
            </div>
            <Link href="/service/new" className="cta-button cta-button--ghost">
              Log another
            </Link>
          </header>

          {lastService ? (
            <div className="panel-body">
              <h3 className="panel-heading">{lastService.service_name}</h3>
              <p className="muted">{lastServiceMeta}</p>
              {lastService.notes && <p className="text-tertiary">“{lastService.notes}”</p>}
            </div>
          ) : (
            <div className="empty-state">
              <p>No services logged yet. Tap “Log Service” to add your first maintenance record.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
