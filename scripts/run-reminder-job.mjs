
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Reminder cron entrypoint.
 *
 * This script invokes the reminder trigger API route so it can be scheduled
 * via the system cron (or any runner) without duplicating business logic.
 */

const DEFAULT_TRIGGER_PATH = '/api/reminders/trigger';
const CONFIG_FILES = ['.env.local', '.env'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(fileName) {
  const fullPath = path.join(projectRoot, fileName);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const contents = fs.readFileSync(fullPath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    const value = line.slice(equalsIndex + 1).trim();

    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  }
}

for (const fileName of CONFIG_FILES) {
  loadEnvFile(fileName);
}

function resolveEndpoint() {
  const explicit = process.env.REMINDER_TRIGGER_URL;
  if (explicit) {
    return explicit;
  }

  const base = process.env.REMINDER_APP_BASE_URL || 'http://localhost:3000';

  try {
    return new URL(DEFAULT_TRIGGER_PATH, base).toString();
  } catch {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}${DEFAULT_TRIGGER_PATH}`;
  }
}

const endpoint = resolveEndpoint();
const secret = process.env.REMINDER_CRON_SECRET;

if (!secret) {
  console.error('[reminder-cron] Missing REMINDER_CRON_SECRET environment variable.');
  process.exit(1);
}

const timeoutRaw = process.env.REMINDER_CRON_TIMEOUT_MS;
const parsedTimeout = Number.parseInt(timeoutRaw ?? '', 10);
const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 35000;
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

let response;

try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`
    },
    signal: controller.signal
  });
} catch (error) {
  clearTimeout(timeoutId);
  console.error(
    `[reminder-cron] Failed to reach ${endpoint}:`,
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

clearTimeout(timeoutId);

const contentType = response.headers.get('content-type') ?? '';
let payload = null;

if (contentType.includes('application/json')) {
  try {
    payload = await response.json();
  } catch (error) {
    console.warn(
      '[reminder-cron] Response returned JSON content-type but could not be parsed:',
      error instanceof Error ? error.message : error
    );
  }
} else {
  const text = await response.text();
  payload = text.length > 0 ? text : null;
}

if (!response.ok) {
  console.error(
    `[reminder-cron] Reminder trigger failed with status ${response.status} ${response.statusText}.`
  );
  if (payload) {
    console.error(
      '[reminder-cron] Response payload:',
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
    );
  }
  process.exit(1);
}

if (payload && typeof payload === 'object') {
  const {
    processedVehicles,
    sentCount,
    skippedCount,
    errorCount,
    mileageSentCount,
    mileageSkippedCount,
    mileageErrorCount,
    sent,
    mileageSent
  } = payload;

  console.log(
    '[reminder-cron] Completed reminder run:',
    JSON.stringify(
      {
        endpoint,
        processedVehicles,
        sentCount,
        skippedCount,
        errorCount,
        mileageSentCount,
        mileageSkippedCount,
        mileageErrorCount,
        serviceReminderMessageIds: Array.isArray(sent)
          ? sent.map((entry) => entry?.messageId).filter(Boolean)
          : [],
        mileageReminderMessageIds: Array.isArray(mileageSent)
          ? mileageSent.map((entry) => entry?.messageId).filter(Boolean)
          : []
      },
      null,
      2
    )
  );
} else {
  console.log('[reminder-cron] Reminder run completed successfully.');
}
