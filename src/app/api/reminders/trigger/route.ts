export const runtime = 'nodejs';

import { timingSafeEqual } from 'crypto';
import { differenceInCalendarDays, differenceInHours, isValid, parseISO } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingServices } from '../../../../lib/dashboard-helpers';
import { sendMileageReminderEmail, sendReminderEmail } from '../../../../lib/reminder-mailer';
import {
  getSchedules,
  getVehiclesWithReminderContact,
  markMileageReminderSent,
  markScheduleReminderSent
} from '../../../../lib/repository';
import type { MaintenanceStatus, ServiceSchedule, Vehicle } from '../../../../lib/types';

const DEFAULT_REPEAT_HOURS = 24;
const DEFAULT_MILEAGE_REMINDER_DAYS = 30;

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

function getMileageReminderWindowDays() {
  const raw = process.env.MILEAGE_REMINDER_DAYS;

  if (!raw) {
    return DEFAULT_MILEAGE_REMINDER_DAYS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MILEAGE_REMINDER_DAYS;
}

function evaluateMileageReminder(
  vehicle: Vehicle,
  thresholdDays: number,
  repeatHours: number,
  now: Date
): { shouldSend: boolean; reason?: string } {
  const baselineIso = vehicle.last_mileage_confirmed_at ?? vehicle.created_at;
  const baseline = parseISO(baselineIso);

  if (!isValid(baseline)) {
    return { shouldSend: false, reason: 'invalid_baseline' };
  }

  const daysSinceBaseline = differenceInCalendarDays(now, baseline);
  if (daysSinceBaseline < thresholdDays) {
    return { shouldSend: false, reason: 'within_threshold' };
  }

  const lastReminderIso = vehicle.last_mileage_reminder_at;
  if (lastReminderIso) {
    const lastReminder = parseISO(lastReminderIso);
    if (isValid(lastReminder) && differenceInHours(now, lastReminder) < repeatHours) {
      return { shouldSend: false, reason: 'recently_sent' };
    }
  }

  return { shouldSend: true };
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
  const expectedHeader = `Bearer ${secret}`;

  if (!timingSafeEquals(authHeader, expectedHeader)) {
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
  const mileageReminderDays = getMileageReminderWindowDays();
  const vehicles = await getVehiclesWithReminderContact();
  const now = new Date();

  const sent: Array<{
    scheduleId: string;
    email: string;
    status: MaintenanceStatus;
    messageId: string;
  }> = [];
  const skipped: Array<{ scheduleId: string; reason: string }> = [];
  const errors: Array<{ scheduleId: string; error: string }> = [];
  const mileageSent: Array<{ vehicleId: string; email: string; messageId: string }> = [];
  const mileageSkipped: Array<{ vehicleId: string; reason: string }> = [];
  const mileageErrors: Array<{ vehicleId: string; error: string }> = [];

  for (const vehicle of vehicles) {
    const recipient = vehicle.contact_email;

    if (!recipient) {
      skipped.push({ scheduleId: 'n/a', reason: 'missing_contact_email' });
      continue;
    }

    const schedules = await getSchedules(vehicle.device_id, vehicle.id);
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
        const sendResult = await sendReminderEmail({
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
          status: upcomingService.status,
          messageId: sendResult.id
        });
      } catch (error) {
        errors.push({
          scheduleId: schedule.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const mileageDecision = evaluateMileageReminder(vehicle, mileageReminderDays, repeatHours, now);

    if (mileageDecision.shouldSend) {
      try {
        const sendResult = await sendMileageReminderEmail({
          sender,
          to: recipient,
          vehicle,
          appBaseUrl
        });
        await markMileageReminderSent(vehicle.id, now);
        mileageSent.push({
          vehicleId: vehicle.id,
          email: recipient,
          messageId: sendResult.id
        });
      } catch (error) {
        mileageErrors.push({
          vehicleId: vehicle.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      mileageSkipped.push({
        vehicleId: vehicle.id,
        reason: mileageDecision.reason ?? 'not_required'
      });
    }
  }

  return NextResponse.json({
    processedVehicles: vehicles.length,
    sentCount: sent.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    sent,
    skipped,
    errors,
    mileageSentCount: mileageSent.length,
    mileageSkippedCount: mileageSkipped.length,
    mileageErrorCount: mileageErrors.length,
    mileageSent,
    mileageSkipped,
    mileageErrors
  });
}

function timingSafeEquals(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  return timingSafeEqual(aBytes, bBytes);
}
