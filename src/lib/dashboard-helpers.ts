import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isValid,
  parseISO
} from 'date-fns';
import type { ServiceLog, ServiceSchedule, Vehicle } from './types';

const DISPLAY_DATE_FORMAT = 'MMM d, yyyy';

export type UpcomingService = {
  schedule: ServiceSchedule;
  daysUntilDue: number | null;
  milesUntilDue: number | null;
  dueDateLabel: string | null;
  status: 'ok' | 'due_soon' | 'overdue';
};

export type TimelineEntry =
  | {
      id: string;
      type: 'upcoming';
      title: string;
      dateLabel: string | null;
      mileageLabel: string | null;
      status: 'ok' | 'due_soon' | 'overdue';
      notes?: string;
    }
  | {
      id: string;
      type: 'completed';
      title: string;
      dateLabel: string;
      mileageLabel: string | null;
      notes?: string | null;
      costLabel: string | null;
    };

export function getUpcomingServices(
  schedules: ServiceSchedule[],
  vehicle: Vehicle
): UpcomingService[] {
  return schedules.map((schedule) => {
    const dueDate = schedule.next_due_date ? parseISO(schedule.next_due_date) : null;
    const daysUntilDue =
      dueDate && isValid(dueDate) ? differenceInCalendarDays(dueDate, new Date()) : null;

    const vehicleMileage = vehicle.current_mileage ?? null;
    const nextDueMileage = schedule.next_due_mileage ?? null;
    const milesUntilDue =
      vehicleMileage !== null && nextDueMileage !== null ? nextDueMileage - vehicleMileage : null;

    const reminderDays = schedule.reminder_lead_days ?? 0;
    const reminderMiles = schedule.reminder_lead_miles ?? 0;

    const dueDateLabel = dueDate && isValid(dueDate) ? format(dueDate, DISPLAY_DATE_FORMAT) : null;

    let status: UpcomingService['status'] = 'ok';

    if (
      (daysUntilDue !== null && daysUntilDue <= 0) ||
      (milesUntilDue !== null && milesUntilDue <= 0)
    ) {
      status = 'overdue';
    } else if (
      (daysUntilDue !== null && reminderDays > 0 && daysUntilDue <= reminderDays) ||
      (milesUntilDue !== null && reminderMiles > 0 && milesUntilDue <= reminderMiles)
    ) {
      status = 'due_soon';
    }

    return {
      schedule,
      daysUntilDue,
      milesUntilDue,
      dueDateLabel,
      status
    };
  });
}

export function pickNextDueService(upcoming: UpcomingService[]): UpcomingService | null {
  if (upcoming.length === 0) {
    return null;
  }

  const sorted = [...upcoming].sort((a, b) => {
    const dateA = a.schedule.next_due_date ? parseISO(a.schedule.next_due_date) : null;
    const dateB = b.schedule.next_due_date ? parseISO(b.schedule.next_due_date) : null;

    if (dateA && dateB && dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    if (dateA && !dateB) {
      return -1;
    }

    if (!dateA && dateB) {
      return 1;
    }

    const milesA = a.schedule.next_due_mileage ?? Number.POSITIVE_INFINITY;
    const milesB = b.schedule.next_due_mileage ?? Number.POSITIVE_INFINITY;

    return milesA - milesB;
  });

  return sorted[0] ?? null;
}

export function getLastService(logs: ServiceLog[]) {
  if (logs.length === 0) {
    return null;
  }

  return logs.reduce((latest, current) => {
    const latestDate = parseISO(latest.service_date);
    const currentDate = parseISO(current.service_date);

    if (isBefore(latestDate, currentDate)) {
      return current;
    }

    return latest;
  }, logs[0]);
}

export function buildTimeline(schedules: ServiceSchedule[], logs: ServiceLog[], vehicle: Vehicle): TimelineEntry[] {
  const upcoming = getUpcomingServices(schedules, vehicle);
  const upcomingEntries = upcoming.map<TimelineEntry>((item) => {
    const mileageLabel =
      item.schedule.next_due_mileage !== null
        ? `${item.schedule.next_due_mileage.toLocaleString()} mi`
        : null;

    return {
      id: `upcoming-${item.schedule.id}`,
      type: 'upcoming',
      title: item.schedule.service_name,
      dateLabel: item.dueDateLabel,
      mileageLabel,
      status: item.status
    };
  });

  const completedEntries = logs.map<TimelineEntry>((log) => {
    const costLabel =
      typeof log.cost_cents === 'number'
        ? `$${(log.cost_cents / 100).toFixed(2)}`
        : null;

    return {
      id: `log-${log.id}`,
      type: 'completed',
      title: log.service_name,
      dateLabel: format(parseISO(log.service_date), DISPLAY_DATE_FORMAT),
      mileageLabel:
        log.mileage !== null ? `${log.mileage.toLocaleString()} mi` : null,
      notes: log.notes,
      costLabel
    };
  });

  return [...upcomingEntries, ...completedEntries];
}

export function nextReminderLabel(service: UpcomingService) {
  if (!service.dueDateLabel && service.milesUntilDue === null) {
    return null;
  }

  const parts: string[] = [];

  if (service.daysUntilDue !== null) {
    if (service.daysUntilDue <= 0) {
      parts.push('Due now');
    } else if (service.daysUntilDue === 1) {
      parts.push('Due tomorrow');
    } else {
      parts.push(`Due in ${service.daysUntilDue} days`);
    }
  }

  if (service.milesUntilDue !== null) {
    if (service.milesUntilDue <= 0) {
      parts.push('Mileage threshold met');
    } else {
      parts.push(`${service.milesUntilDue.toLocaleString()} miles remaining`);
    }
  }

  return parts.join(' • ');
}

export function reminderPreviewDate(service: UpcomingService) {
  if (!service.schedule.next_due_date || !(service.schedule.reminder_lead_days ?? 0)) {
    return null;
  }

  const dueDate = parseISO(service.schedule.next_due_date);
  if (!isValid(dueDate)) {
    return null;
  }

  const reminderDate = addDays(dueDate, -(service.schedule.reminder_lead_days ?? 0));
  return format(reminderDate, DISPLAY_DATE_FORMAT);
}
