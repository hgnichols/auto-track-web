import { Resend } from 'resend';
import { nextReminderLabel } from './dashboard-helpers';
import type { UpcomingService } from './dashboard-helpers';
import type { Vehicle } from './types';

type SendReminderEmailParams = {
  sender: string;
  to: string;
  vehicle: Vehicle;
  service: UpcomingService;
  appBaseUrl: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export async function sendReminderEmail(params: SendReminderEmailParams) {
  const { sender, to, vehicle, service, appBaseUrl } = params;

  if (!sender) {
    throw new Error('Missing REMINDER_FROM_EMAIL environment variable.');
  }

  if (!to) {
    throw new Error('Missing recipient email address.');
  }

  const serviceName = service.schedule.service_name;
  const subject = `AutoTrack reminder: ${serviceName}`;
  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  const reminderSummary =
    nextReminderLabel(service) ?? 'Stay on track with your maintenance schedule.';

  const detailParts: string[] = [];
  if (service.dueDateLabel) {
    detailParts.push(`Target date: ${service.dueDateLabel}`);
  }
  if (service.milesUntilDue !== null) {
    detailParts.push(
      service.milesUntilDue <= 0
        ? 'Mileage threshold reached'
        : `${service.milesUntilDue.toLocaleString()} miles remaining`
    );
  }

  let serviceUrl: string | null = null;
  try {
    serviceUrl = new URL('/service/new', appBaseUrl).toString();
  } catch {
    serviceUrl = null;
  }

  const textLines = [
    `Hi there!`,
    ``,
    `${serviceName} is coming up for ${vehicleLabel || 'your vehicle'}.`,
    reminderSummary,
    detailParts.length > 0 ? detailParts.join(' | ') : '',
    serviceUrl ? `` : '',
    serviceUrl ? `Log the service now: ${serviceUrl}` : '',
    ``,
    `Keep your maintenance on track with AutoTrack.`
  ].filter((line) => line.trim().length > 0);

  const htmlParts: string[] = [
    `<p style="margin:0 0 16px; font-size:16px;">${serviceName} is coming up for <strong>${vehicleLabel || 'your vehicle'}</strong>.</p>`,
    `<p style="margin:0 0 12px; font-size:15px;">${reminderSummary}</p>`
  ];

  if (detailParts.length > 0) {
    htmlParts.push(
      `<ul style="margin:0 0 16px; padding-left:20px; font-size:14px;">${detailParts
        .map((part) => `<li>${part}</li>`)
        .join('')}</ul>`
    );
  }

  if (serviceUrl) {
    htmlParts.push(
      `<p style="margin:0 0 16px;"><a href="${serviceUrl}" style="display:inline-block; background:#0a84ff; color:#fff; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">Log this service</a></p>`
    );
  }

  htmlParts.push(
    `<p style="margin:24px 0 0; font-size:13px; color:#6b7280;">You are receiving this reminder because you asked AutoTrack to keep you up to date on maintenance.</p>`
  );

  await getResendClient().emails.send({
    from: sender,
    to,
    subject,
    text: textLines.join('\n'),
    html: htmlParts.join('')
  });
}

type SendMileageReminderEmailParams = {
  sender: string;
  to: string;
  vehicle: Vehicle;
  appBaseUrl: string;
};

export async function sendMileageReminderEmail(params: SendMileageReminderEmailParams) {
  const { sender, to, vehicle, appBaseUrl } = params;

  if (!sender) {
    throw new Error('Missing REMINDER_FROM_EMAIL environment variable.');
  }

  if (!to) {
    throw new Error('Missing recipient email address.');
  }

  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  const subject = 'AutoTrack reminder: Update your mileage';
  const updateUrl = (() => {
    try {
      return new URL('/vehicle/mileage', appBaseUrl).toString();
    } catch {
      return null;
    }
  })();

  const textLines = [
    'Hi there!',
    '',
    `It has been a while since you updated the mileage for ${vehicleLabel || 'your vehicle'}.`,
    'Keeping your odometer reading current helps AutoTrack send accurate maintenance reminders.'
  ];

  if (updateUrl) {
    textLines.push('', `Update your mileage now: ${updateUrl}`);
  }

  textLines.push('', 'Safe driving! — The AutoTrack team');

  const filteredTextLines = textLines.filter((line) => line.trim().length > 0);

  const htmlParts: string[] = [
    `<p style="margin:0 0 16px; font-size:16px;">It has been a while since you updated the mileage for <strong>${vehicleLabel || 'your vehicle'}</strong>.</p>`,
    `<p style="margin:0 0 16px; font-size:15px;">Keeping your odometer reading current helps AutoTrack keep your maintenance reminders accurate.</p>`
  ];

  if (updateUrl) {
    htmlParts.push(
      `<p style="margin:0 0 16px;"><a href="${updateUrl}" style="display:inline-block; background:#0a84ff; color:#fff; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:600;">Update mileage</a></p>`
    );
  }

  htmlParts.push(
    `<p style="margin:24px 0 0; font-size:13px; color:#6b7280;">You are receiving this reminder because you asked AutoTrack to send mileage updates.</p>`
  );

  await getResendClient().emails.send({
    from: sender,
    to,
    subject,
    text: filteredTextLines.join('\n'),
    html: htmlParts.join('')
  });
}
