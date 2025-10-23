import { addMonths, format } from 'date-fns';
import { DEFAULT_SERVICE_TEMPLATES, type ServiceTemplate } from './constants';
import { createAdminClient } from './supabase/admin';
import type {
  DashboardData,
  MaintenanceStatus,
  MaintenanceCatalogEntry,
  ServiceLog,
  ServiceSchedule,
  Vehicle,
  VehicleCatalogEntry
} from './types';
import { getMaintenanceCatalogEntries } from './maintenance-catalog';
import {
  getVehicleCatalogEntry as getCatalogEntry,
  getVehicleCatalogMakes as getCatalogMakes,
  getVehicleCatalogModels as getCatalogModels,
  getVehicleCatalogYears as getCatalogYears
} from './vehicle-catalog';

const DATE_FORMAT = 'yyyy-MM-dd';
const SUPABASE_RETRYABLE_UNDICI_CODES = new Set([
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_CONNECTION_RESET',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET'
]);

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableSupabaseError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof TypeError || error instanceof Error) {
    return error.message.toLowerCase().includes('fetch failed');
  }

  if (typeof error === 'string') {
    return error.toLowerCase().includes('fetch failed');
  }

  if (typeof error !== 'object') {
    return false;
  }

  const candidate = error as { message?: unknown; code?: unknown; cause?: unknown };

  const code = candidate.code;
  if (typeof code === 'string' && SUPABASE_RETRYABLE_UNDICI_CODES.has(code)) {
    return true;
  }

  const message = candidate.message;
  if (typeof message === 'string' && message.toLowerCase().includes('fetch failed')) {
    return true;
  }

  const cause = candidate.cause;
  if (cause && typeof cause === 'object') {
    const nestedCode = (cause as { code?: unknown }).code;
    if (typeof nestedCode === 'string' && SUPABASE_RETRYABLE_UNDICI_CODES.has(nestedCode)) {
      return true;
    }
    const nestedMessage = (cause as { message?: unknown }).message;
    if (typeof nestedMessage === 'string' && nestedMessage.toLowerCase().includes('fetch failed')) {
      return true;
    }
  }

  return false;
}

async function withSupabaseRetry<T>(
  operation: () => Promise<T>,
  { retries = 2, baseDelayMs = 500 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableSupabaseError(error) || attempt === retries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await wait(delay);
      attempt += 1;
    }
  }

  throw lastError ?? new Error('Unexpected Supabase retry failure.');
}

type CreateVehiclePayload = {
  year?: number | null;
  make: string;
  model: string;
  vin?: string | null;
  contact_email?: string | null;
  current_mileage?: number | null;
};

type CreateServiceLogPayload = {
  scheduleId: string;
  serviceDate: string;
  mileage?: number | null;
  cost?: number | null;
  notes?: string | null;
};

type CreateCustomServiceLogPayload = {
  serviceName: string;
  serviceDate: string;
  mileage?: number | null;
  cost?: number | null;
  notes?: string | null;
};

type ScheduleTemplate = ServiceTemplate & {
  firstDueMileage?: number | null;
};

function computeReminderLeadMiles(intervalMiles: number | null): number | null {
  if (!intervalMiles || intervalMiles <= 0) {
    return null;
  }
  const lead = Math.round(intervalMiles * 0.1);
  return Math.min(1000, Math.max(250, lead));
}

function computeReminderLeadDays(intervalMonths: number | null): number | null {
  if (!intervalMonths || intervalMonths <= 0) {
    return null;
  }
  const approximateDays = Math.round(intervalMonths * 30 * 0.2);
  return Math.min(45, Math.max(7, approximateDays || 7));
}

function mapMaintenanceEntryToTemplate(entry: MaintenanceCatalogEntry): ScheduleTemplate | null {
  const intervalMiles =
    entry.interval_miles && entry.interval_miles > 0 ? entry.interval_miles : null;
  const intervalMonths =
    entry.interval_months && entry.interval_months > 0 ? entry.interval_months : null;

  if (!intervalMiles && !intervalMonths) {
    return null;
  }

  return {
    code: entry.service_code,
    name: entry.service_name,
    intervalMiles,
    intervalMonths,
    reminderLeadMiles: computeReminderLeadMiles(intervalMiles),
    reminderLeadDays: computeReminderLeadDays(intervalMonths),
    firstDueMileage:
      entry.first_due_mileage && entry.first_due_mileage > 0 ? entry.first_due_mileage : null
  };
}

async function resolveScheduleTemplates(
  year: number | null | undefined,
  make: string,
  model: string
): Promise<ScheduleTemplate[]> {
  if (!year || !Number.isFinite(year)) {
    return [];
  }

  const catalogEntry = await getCatalogEntry(year, make, model);

  if (!catalogEntry) {
    return [];
  }

  const maintenanceEntries = await getMaintenanceCatalogEntries(
    catalogEntry.year,
    catalogEntry.make,
    catalogEntry.model
  );

  if (!maintenanceEntries.length) {
    return [];
  }

  const templates = new Map<string, ScheduleTemplate>();

  for (const entry of maintenanceEntries) {
    const template = mapMaintenanceEntryToTemplate(entry);
    if (!template) {
      continue;
    }

    const existing = templates.get(template.code);
    if (!existing) {
      templates.set(template.code, template);
      continue;
    }

    const currentFirstDue = existing.firstDueMileage ?? Number.POSITIVE_INFINITY;
    const candidateFirstDue = template.firstDueMileage ?? Number.POSITIVE_INFINITY;

    if (candidateFirstDue < currentFirstDue) {
      templates.set(template.code, template);
    }
  }

  return Array.from(templates.values()).sort((a, b) => {
    const aDue = a.firstDueMileage ?? Number.POSITIVE_INFINITY;
    const bDue = b.firstDueMileage ?? Number.POSITIVE_INFINITY;

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getVehicleCatalogYears(): Promise<number[]> {
  return getCatalogYears();
}

export async function getVehicleCatalogMakes(year: number) {
  return getCatalogMakes(year);
}

export async function getVehicleCatalogModels(year: number, make: string) {
  return getCatalogModels(year, make);
}

export async function getVehicleCatalogEntry(
  year: number,
  make: string,
  model: string
): Promise<VehicleCatalogEntry | null> {
  return getCatalogEntry(year, make, model);
}

export async function ensureDevice(deviceId: string) {
  const client = createAdminClient();
  await withSupabaseRetry(async () => {
    const { error } = await client.from('devices').upsert({ id: deviceId }).select('id').single();
    if (error) {
      throw error;
    }
  });
}

export async function getVehicleByDevice(deviceId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from('vehicles')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Vehicle | null;
}

export async function createVehicle(deviceId: string, payload: CreateVehiclePayload) {
  const client = createAdminClient();
  const now = new Date().toISOString();
  const scheduleTemplates = await resolveTemplatesOrDefault(
    payload.year ?? null,
    payload.make,
    payload.model
  );
  const contactEmail =
    typeof payload.contact_email === 'string' && payload.contact_email.trim().length > 0
      ? payload.contact_email.trim().toLowerCase()
      : null;
  const { data, error } = await client
    .from('vehicles')
    .insert({
      device_id: deviceId,
      year: payload.year ?? null,
      make: payload.make,
      model: payload.model,
      vin: payload.vin?.trim() || null,
      contact_email: contactEmail,
      current_mileage: payload.current_mileage ?? null,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await createSchedulesForVehicle(
    deviceId,
    data.id,
    payload.current_mileage ?? null,
    now,
    scheduleTemplates
  );

  return data as Vehicle;
}

async function createSchedulesForVehicle(
  deviceId: string,
  vehicleId: string,
  currentMileage: number | null,
  referenceIsoDate: string,
  templates: ScheduleTemplate[]
) {
  const client = createAdminClient();
  const referenceDate = new Date(referenceIsoDate);
  const scheduleRows = templates.map((template) => {
    const intervalMonths =
      typeof template.intervalMonths === 'number' && template.intervalMonths > 0
        ? template.intervalMonths
        : null;
    const intervalMiles =
      typeof template.intervalMiles === 'number' && template.intervalMiles > 0
        ? template.intervalMiles
        : null;
    const reminderLeadDays =
      typeof template.reminderLeadDays === 'number' && template.reminderLeadDays > 0
        ? template.reminderLeadDays
        : null;
    const reminderLeadMiles =
      typeof template.reminderLeadMiles === 'number' && template.reminderLeadMiles > 0
        ? template.reminderLeadMiles
        : null;

    const dueDate =
      intervalMonths && intervalMonths > 0
        ? format(addMonths(referenceDate, intervalMonths), DATE_FORMAT)
        : null;

    const firstDueMileage =
      template.firstDueMileage && template.firstDueMileage > 0
        ? template.firstDueMileage
        : intervalMiles;

    const dueMileage =
      intervalMiles && currentMileage !== null
        ? currentMileage + intervalMiles
        : firstDueMileage ?? null;

    const intervalMilesValue = intervalMiles ?? null;
    const intervalMonthsValue = intervalMonths ?? null;

    return {
      device_id: deviceId,
      vehicle_id: vehicleId,
      service_code: template.code,
      service_name: template.name,
      interval_months: intervalMonthsValue,
      interval_miles: intervalMilesValue,
      reminder_lead_days: reminderLeadDays,
      reminder_lead_miles: reminderLeadMiles,
      next_due_date: dueDate,
      next_due_mileage: dueMileage,
      created_at: referenceIsoDate,
      updated_at: referenceIsoDate
    };
  });

  if (!scheduleRows.length) {
    return;
  }

  const { error } = await client.from('service_schedules').insert(scheduleRows);

  if (error) {
    throw error;
  }
}

async function resolveTemplatesOrDefault(
  year: number | null | undefined,
  make: string,
  model: string
): Promise<ScheduleTemplate[]> {
  const manufacturerTemplates = await resolveScheduleTemplates(year, make, model);

  if (manufacturerTemplates.length > 0) {
    return manufacturerTemplates;
  }

  return DEFAULT_SERVICE_TEMPLATES.map((template) => ({
    ...template,
    firstDueMileage:
      typeof template.intervalMiles === 'number' && template.intervalMiles > 0
        ? template.intervalMiles
        : null
  }));
}

export async function ensureSchedulesExist(deviceId: string, vehicle: Vehicle) {
  const client = createAdminClient();
  const { data, error } = await client
    .from('service_schedules')
    .select('id')
    .limit(1)
    .eq('device_id', deviceId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const templates = await resolveTemplatesOrDefault(
      vehicle.year ?? null,
      vehicle.make,
      vehicle.model
    );

    await createSchedulesForVehicle(
      deviceId,
      vehicle.id,
      vehicle.current_mileage ?? null,
      vehicle.created_at,
      templates
    );
  }
}

export async function getSchedules(deviceId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from('service_schedules')
    .select('*')
    .eq('device_id', deviceId)
    .order('next_due_date', { ascending: true, nullsFirst: false })
    .order('service_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data as ServiceSchedule[]) ?? [];
}

export async function getServiceLogs(deviceId: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from('service_logs')
    .select('*')
    .eq('device_id', deviceId)
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ServiceLog[]) ?? [];
}

export async function createServiceLog(
  deviceId: string,
  vehicle: Vehicle,
  payload: CreateServiceLogPayload
) {
  const client = createAdminClient();
  const schedule = await getScheduleById(payload.scheduleId);

  if (!schedule) {
    throw new Error('Schedule not found for service log.');
  }

  const nowIso = new Date().toISOString();
  const mileageValue = payload.mileage ?? null;
  const costCents =
    typeof payload.cost === 'number' && !Number.isNaN(payload.cost)
      ? Math.round(payload.cost * 100)
      : null;

  const { error: insertError } = await client.from('service_logs').insert({
    device_id: deviceId,
    vehicle_id: vehicle.id,
    schedule_id: schedule.id,
    service_code: schedule.service_code,
    service_name: schedule.service_name,
    service_date: payload.serviceDate,
    mileage: mileageValue,
    cost_cents: costCents,
    notes: payload.notes?.trim() || null,
    created_at: nowIso
  });

  if (insertError) {
    throw insertError;
  }

  await updateScheduleAfterService(schedule, payload);

  if (
    mileageValue !== null &&
    (vehicle.current_mileage === null || mileageValue > vehicle.current_mileage)
  ) {
    await updateVehicleMileage(vehicle.id, mileageValue);
  }
}

export async function createCustomServiceLog(
  deviceId: string,
  vehicle: Vehicle,
  payload: CreateCustomServiceLogPayload
) {
  const client = createAdminClient();
  const nowIso = new Date().toISOString();
  const mileageValue = payload.mileage ?? null;
  const costCents =
    typeof payload.cost === 'number' && !Number.isNaN(payload.cost)
      ? Math.round(payload.cost * 100)
      : null;

  const { error } = await client.from('service_logs').insert({
    device_id: deviceId,
    vehicle_id: vehicle.id,
    schedule_id: null,
    service_code: null,
    service_name: payload.serviceName.trim(),
    service_date: payload.serviceDate,
    mileage: mileageValue,
    cost_cents: costCents,
    notes: payload.notes?.trim() || null,
    created_at: nowIso
  });

  if (error) {
    throw error;
  }

  if (
    mileageValue !== null &&
    (vehicle.current_mileage === null || mileageValue > vehicle.current_mileage)
  ) {
    await updateVehicleMileage(vehicle.id, mileageValue);
  }
}

async function getScheduleById(id: string) {
  const client = createAdminClient();
  const { data, error } = await client.from('service_schedules').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  return data as ServiceSchedule;
}

async function updateScheduleAfterService(
  schedule: ServiceSchedule,
  payload: CreateServiceLogPayload
) {
  const client = createAdminClient();
  const serviceDate = payload.serviceDate;
  const mileage = payload.mileage ?? null;
  const now = new Date().toISOString();

  const nextDueDate =
    schedule.interval_months && schedule.interval_months > 0
      ? format(addMonths(new Date(serviceDate), schedule.interval_months), DATE_FORMAT)
      : schedule.next_due_date;

  const nextDueMileage =
    schedule.interval_miles && schedule.interval_miles > 0 && mileage !== null
      ? mileage + schedule.interval_miles
      : schedule.next_due_mileage;

  const { error } = await client
    .from('service_schedules')
    .update({
      last_completed_date: serviceDate,
      last_completed_mileage: mileage,
      next_due_date: nextDueDate,
      next_due_mileage: nextDueMileage,
      last_reminder_sent_at: null,
      last_reminder_status: null,
      updated_at: now
    })
    .eq('id', schedule.id);

  if (error) {
    throw error;
  }
}

async function updateVehicleMileage(vehicleId: string, mileage: number) {
  const client = createAdminClient();
  const { error } = await client
    .from('vehicles')
    .update({
      current_mileage: mileage,
      updated_at: new Date().toISOString()
    })
    .eq('id', vehicleId);

  if (error) {
    throw error;
  }
}

export async function getVehiclesWithReminderContact() {
  const client = createAdminClient();
  const { data, error } = await client
    .from('vehicles')
    .select('*')
    .not('contact_email', 'is', null);

  if (error) {
    throw error;
  }

  const vehicles = (data as Vehicle[]) ?? [];
  return vehicles.filter((vehicle) => !!vehicle.contact_email);
}

export async function markScheduleReminderSent(
  scheduleId: string,
  status: MaintenanceStatus,
  sentAt: Date
) {
  const client = createAdminClient();
  const { error } = await client
    .from('service_schedules')
    .update({
      last_reminder_sent_at: sentAt.toISOString(),
      last_reminder_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduleId);

  if (error) {
    throw error;
  }
}

export async function getDashboardData(deviceId: string): Promise<DashboardData | null> {
  await ensureDevice(deviceId);

  const vehicle = await getVehicleByDevice(deviceId);

  if (!vehicle) {
    return null;
  }

  await ensureSchedulesExist(deviceId, vehicle);

  const [schedules, logs] = await Promise.all([getSchedules(deviceId), getServiceLogs(deviceId)]);

  return {
    vehicle,
    schedules,
    logs
  };
}
