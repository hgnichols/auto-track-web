export const runtime = 'nodejs';

import { differenceInHours, isValid, parseISO } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingServices } from '../../../../lib/dashboard-helpers';
import { sendReminderEmail } from '../../../../lib/reminder-mailer';
import {
  getSchedules,
  getVehiclesWithReminderContact,
  markScheduleReminderSent
} from '../../../../lib/repository';
import type { MaintenanceStatus, ServiceSchedule, Vehicle } from '../../../../lib/types';

const DEFAULT_REPEAT_HOURS = 24;

function shouldSendReminder(
  schedule: ServiceSchedule,
  status: MaintenanceStatus,
  repeatHours: number,
  now: Date
) {
  const lastSentIso = schedule.last_reminder_sent_at;

  if (!lastSentIso) {
    return true;
  }

  const lastSent = parseISO(lastSentIso);

  if (!isValid(lastSent)) {
    return true;
  }

  if (schedule.last_reminder_status !== status) {
    return true;
  }

  return differenceInHours(now, lastSent) >= repeatHours;
}

function getRepeatWindowHours() {
  const raw = process.env.REMINDER_REPEAT_HOURS;
  if (!raw) {
    return DEFAULT_REPEAT_HOURS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REPEAT_HOURS;
}

export async function POST(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'Missing REMINDER_CRON_SECRET environment variable.' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const sender = process.env.REMINDER_FROM_EMAIL;
  if (!sender) {
    return NextResponse.json(
      { error: 'Missing REMINDER_FROM_EMAIL environment variable.' },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Missing RESEND_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  const appBaseUrl = process.env.REMINDER_APP_BASE_URL ?? 'http://localhost:3000';
  const repeatHours = getRepeatWindowHours();
  const vehicles = await getVehiclesWithReminderContact();
  const now = new Date();

  const sent: Array<{ scheduleId: string; email: string; status: MaintenanceStatus }> = [];
  const skipped: Array<{ scheduleId: string; reason: string }> = [];
  const errors: Array<{ scheduleId: string; error: string }> = [];

  for (const vehicle of vehicles) {
    const recipient = vehicle.contact_email;

    if (!recipient) {
      skipped.push({ scheduleId: 'n/a', reason: 'missing_contact_email' });
      continue;
    }

    const schedules = await getSchedules(vehicle.device_id);
    const upcoming = getUpcomingServices(schedules, vehicle);

    for (const upcomingService of upcoming) {
      if (upcomingService.status === 'ok') {
        continue;
      }

      const schedule = upcomingService.schedule;

      if (!shouldSendReminder(schedule, upcomingService.status, repeatHours, now)) {
        skipped.push({ scheduleId: schedule.id, reason: 'recently_sent' });
        continue;
      }

      try {
        await sendReminderEmail({
          sender,
          to: recipient,
          vehicle,
          service: upcomingService,
          appBaseUrl
        });
        await markScheduleReminderSent(schedule.id, upcomingService.status, now);
        sent.push({
          scheduleId: schedule.id,
          email: recipient,
          status: upcomingService.status
        });
      } catch (error) {
        errors.push({
          scheduleId: schedule.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return NextResponse.json({
    processedVehicles: vehicles.length,
    sentCount: sent.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    sent,
    skipped,
    errors
  });
}
