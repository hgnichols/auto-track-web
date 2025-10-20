import { addMonths, format } from 'date-fns';
import { DEFAULT_SERVICE_TEMPLATES } from './constants';
import { createAdminClient } from './supabase/admin';
import type {
  DashboardData,
  MaintenanceStatus,
  ServiceLog,
  ServiceSchedule,
  Vehicle
} from './types';

const DATE_FORMAT = 'yyyy-MM-dd';

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

export async function ensureDevice(deviceId: string) {
  const client = createAdminClient();
  const { error } = await client.from('devices').upsert({ id: deviceId }).single();

  if (error) {
    throw error;
  }
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

  await createDefaultSchedulesForVehicle(deviceId, data.id, payload.current_mileage ?? null, now);

  return data as Vehicle;
}

async function createDefaultSchedulesForVehicle(
  deviceId: string,
  vehicleId: string,
  currentMileage: number | null,
  referenceIsoDate: string
) {
  const client = createAdminClient();
  const referenceDate = new Date(referenceIsoDate);
  const scheduleRows = DEFAULT_SERVICE_TEMPLATES.map((template) => {
    const dueDate =
      template.intervalMonths > 0
        ? format(addMonths(referenceDate, template.intervalMonths), DATE_FORMAT)
        : null;

    const dueMileage =
      template.intervalMiles > 0 && currentMileage !== null
        ? currentMileage + template.intervalMiles
        : template.intervalMiles > 0
        ? template.intervalMiles
        : null;

    return {
      device_id: deviceId,
      vehicle_id: vehicleId,
      service_code: template.code,
      service_name: template.name,
      interval_months: template.intervalMonths,
      interval_miles: template.intervalMiles,
      reminder_lead_days: template.reminderLeadDays,
      reminder_lead_miles: template.reminderLeadMiles,
      next_due_date: dueDate,
      next_due_mileage: dueMileage,
      created_at: referenceIsoDate,
      updated_at: referenceIsoDate
    };
  });

  const { error } = await client.from('service_schedules').insert(scheduleRows);

  if (error) {
    throw error;
  }
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
    await createDefaultSchedulesForVehicle(
      deviceId,
      vehicle.id,
      vehicle.current_mileage ?? null,
      vehicle.created_at
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
