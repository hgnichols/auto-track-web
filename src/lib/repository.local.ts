import { randomUUID } from 'node:crypto';
import { addMonths, format } from 'date-fns';
import { DEFAULT_SERVICE_TEMPLATES, type ServiceTemplate } from './constants';
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

type LocalDatabase = {
  devices: Set<string>;
  vehicles: Vehicle[];
  schedules: ServiceSchedule[];
  serviceLogs: ServiceLog[];
};

const initialDevices = ['device-alpha', 'device-beta', 'device-gamma'];

const localDb: LocalDatabase = {
  devices: new Set(initialDevices),
  vehicles: [
    {
      id: 'veh-alpha',
      device_id: 'device-alpha',
      year: 2018,
      make: 'Toyota',
      model: 'Camry',
      vin: '4T1BF1FK0JU123456',
      contact_email: 'alex.tan@example.com',
      current_mileage: 45210,
      last_mileage_confirmed_at: '2024-05-04T15:45:00.000Z',
      last_mileage_reminder_at: '2024-04-15T10:30:00.000Z',
      created_at: '2023-10-02T09:15:00.000Z',
      updated_at: '2024-05-04T15:45:00.000Z'
    },
    {
      id: 'veh-beta',
      device_id: 'device-beta',
      year: 2021,
      make: 'Ford',
      model: 'F-150',
      vin: '1FTFW1E58MFA12345',
      contact_email: null,
      current_mileage: 23650,
      last_mileage_confirmed_at: '2024-04-21T11:00:00.000Z',
      last_mileage_reminder_at: null,
      created_at: '2022-06-12T13:10:00.000Z',
      updated_at: '2024-04-21T11:00:00.000Z'
    },
    {
      id: 'veh-gamma',
      device_id: 'device-gamma',
      year: 2015,
      make: 'Honda',
      model: 'CR-V',
      vin: '2HKRM4H77FH123456',
      contact_email: 'nina.fernandez@example.com',
      current_mileage: 98210,
      last_mileage_confirmed_at: '2024-03-30T08:20:00.000Z',
      last_mileage_reminder_at: '2024-02-28T07:50:00.000Z',
      created_at: '2021-01-20T16:40:00.000Z',
      updated_at: '2024-03-30T08:20:00.000Z'
    }
  ],
  schedules: [
    {
      id: 'sch-alpha-oil',
      device_id: 'device-alpha',
      vehicle_id: 'veh-alpha',
      service_code: 'OIL_CHANGE',
      service_name: 'Engine Oil & Filter',
      interval_months: 6,
      interval_miles: 5000,
      reminder_lead_days: 14,
      reminder_lead_miles: 500,
      next_due_date: '2024-07-01',
      next_due_mileage: 50000,
      last_completed_date: '2024-01-03',
      last_completed_mileage: 41000,
      last_reminder_sent_at: '2024-06-17T14:00:00.000Z',
      last_reminder_status: 'due_soon',
      created_at: '2023-10-02T09:15:00.000Z',
      updated_at: '2024-06-17T14:00:00.000Z'
    },
    {
      id: 'sch-alpha-tires',
      device_id: 'device-alpha',
      vehicle_id: 'veh-alpha',
      service_code: 'TIRE_ROTATION',
      service_name: 'Tire Rotation',
      interval_months: 6,
      interval_miles: 6000,
      reminder_lead_days: 21,
      reminder_lead_miles: 600,
      next_due_date: '2024-08-15',
      next_due_mileage: 51200,
      last_completed_date: '2024-02-10',
      last_completed_mileage: 43000,
      last_reminder_sent_at: null,
      last_reminder_status: null,
      created_at: '2023-10-02T09:15:00.000Z',
      updated_at: '2024-02-10T09:50:00.000Z'
    },
    {
      id: 'sch-beta-brake',
      device_id: 'device-beta',
      vehicle_id: 'veh-beta',
      service_code: 'BRAKE_INSPECTION',
      service_name: 'Brake Inspection',
      interval_months: 12,
      interval_miles: 12000,
      reminder_lead_days: 30,
      reminder_lead_miles: 900,
      next_due_date: '2024-05-05',
      next_due_mileage: 25000,
      last_completed_date: '2023-05-01',
      last_completed_mileage: 12000,
      last_reminder_sent_at: '2024-04-05T10:00:00.000Z',
      last_reminder_status: 'overdue',
      created_at: '2022-06-12T13:10:00.000Z',
      updated_at: '2024-04-05T10:00:00.000Z'
    },
    {
      id: 'sch-gamma-trans',
      device_id: 'device-gamma',
      vehicle_id: 'veh-gamma',
      service_code: 'TRANSMISSION_SERVICE',
      service_name: 'Transmission Fluid Service',
      interval_months: 36,
      interval_miles: 36000,
      reminder_lead_days: 30,
      reminder_lead_miles: 1500,
      next_due_date: '2025-11-15',
      next_due_mileage: 108000,
      last_completed_date: '2022-11-20',
      last_completed_mileage: 72000,
      last_reminder_sent_at: null,
      last_reminder_status: null,
      created_at: '2021-01-20T16:40:00.000Z',
      updated_at: '2022-11-20T16:40:00.000Z'
    },
    {
      id: 'sch-gamma-cabin',
      device_id: 'device-gamma',
      vehicle_id: 'veh-gamma',
      service_code: 'CABIN_FILTER',
      service_name: 'Cabin Air Filter Replacement',
      interval_months: 12,
      interval_miles: 15000,
      reminder_lead_days: 21,
      reminder_lead_miles: 750,
      next_due_date: '2024-03-01',
      next_due_mileage: 99000,
      last_completed_date: '2023-03-01',
      last_completed_mileage: 84000,
      last_reminder_sent_at: '2024-02-10T09:00:00.000Z',
      last_reminder_status: 'overdue',
      created_at: '2021-01-20T16:40:00.000Z',
      updated_at: '2024-02-10T09:00:00.000Z'
    }
  ],
  serviceLogs: [
    {
      id: 'log-alpha-1',
      device_id: 'device-alpha',
      vehicle_id: 'veh-alpha',
      schedule_id: 'sch-alpha-oil',
      service_code: 'OIL_CHANGE',
      service_name: 'Engine Oil & Filter',
      service_date: '2024-01-03',
      mileage: 41000,
      cost_cents: 8500,
      notes: 'Used synthetic oil. Checked fluids.',
      created_at: '2024-01-03T16:00:00.000Z'
    },
    {
      id: 'log-alpha-2',
      device_id: 'device-alpha',
      vehicle_id: 'veh-alpha',
      schedule_id: 'sch-alpha-tires',
      service_code: 'TIRE_ROTATION',
      service_name: 'Tire Rotation',
      service_date: '2024-02-10',
      mileage: 43000,
      cost_cents: 4000,
      notes: 'Rotated and balanced tires.',
      created_at: '2024-02-10T18:20:00.000Z'
    },
    {
      id: 'log-beta-1',
      device_id: 'device-beta',
      vehicle_id: 'veh-beta',
      schedule_id: null,
      service_code: null,
      service_name: 'Bed Liner Installation',
      service_date: '2023-08-12',
      mileage: 15000,
      cost_cents: 28000,
      notes: 'Spray-in liner upgrade.',
      created_at: '2023-08-12T15:10:00.000Z'
    },
    {
      id: 'log-gamma-1',
      device_id: 'device-gamma',
      vehicle_id: 'veh-gamma',
      schedule_id: 'sch-gamma-cabin',
      service_code: 'CABIN_FILTER',
      service_name: 'Cabin Air Filter Replacement',
      service_date: '2023-03-01',
      mileage: 84000,
      cost_cents: 3500,
      notes: 'Replaced filter and cleaned vents.',
      created_at: '2023-03-01T13:45:00.000Z'
    }
  ]
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

function createSchedulesForVehicle(
  deviceId: string,
  vehicleId: string,
  currentMileage: number | null,
  referenceIsoDate: string,
  templates: ScheduleTemplate[]
) {
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

    const nowIso = new Date().toISOString();

    return {
      id: randomUUID(),
      device_id: deviceId,
      vehicle_id: vehicleId,
      service_code: template.code,
      service_name: template.name,
      interval_months: intervalMonths,
      interval_miles: intervalMiles,
      reminder_lead_days: reminderLeadDays,
      reminder_lead_miles: reminderLeadMiles,
      next_due_date: dueDate,
      next_due_mileage: dueMileage,
      last_completed_date: null,
      last_completed_mileage: null,
      last_reminder_sent_at: null,
      last_reminder_status: null,
      created_at: nowIso,
      updated_at: nowIso
    } satisfies ServiceSchedule;
  });

  if (!scheduleRows.length) {
    return;
  }

  localDb.schedules.push(...scheduleRows);
}

function getScheduleById(id: string) {
  return localDb.schedules.find((schedule) => schedule.id === id) ?? null;
}

function updateScheduleAfterService(schedule: ServiceSchedule, payload: CreateServiceLogPayload) {
  const serviceDate = payload.serviceDate;
  const mileage = payload.mileage ?? null;
  const nextDueDate =
    schedule.interval_months && schedule.interval_months > 0
      ? format(addMonths(new Date(serviceDate), schedule.interval_months), DATE_FORMAT)
      : schedule.next_due_date;

  const nextDueMileage =
    schedule.interval_miles && schedule.interval_miles > 0 && mileage !== null
      ? mileage + schedule.interval_miles
      : schedule.next_due_mileage;

  schedule.last_completed_date = serviceDate;
  schedule.last_completed_mileage = mileage;
  schedule.next_due_date = nextDueDate;
  schedule.next_due_mileage = nextDueMileage;
  schedule.last_reminder_sent_at = null;
  schedule.last_reminder_status = null;
  schedule.updated_at = new Date().toISOString();
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
  localDb.devices.add(deviceId);
}

export async function getVehicleByDevice(deviceId: string) {
  return localDb.vehicles.find((vehicle) => vehicle.device_id === deviceId) ?? null;
}

export async function createVehicle(deviceId: string, payload: CreateVehiclePayload) {
  await ensureDevice(deviceId);
  const now = new Date().toISOString();
  const scheduleTemplates = await resolveTemplatesOrDefault(
    payload.year ?? null,
    payload.make,
    payload.model
  );
  const initialMileage =
    typeof payload.current_mileage === 'number' && Number.isFinite(payload.current_mileage)
      ? payload.current_mileage
      : null;
  const contactEmail =
    typeof payload.contact_email === 'string' && payload.contact_email.trim().length > 0
      ? payload.contact_email.trim().toLowerCase()
      : null;

  const vehicle: Vehicle = {
    id: randomUUID(),
    device_id: deviceId,
    year: payload.year ?? null,
    make: payload.make,
    model: payload.model,
    vin: payload.vin?.trim() || null,
    contact_email: contactEmail,
    current_mileage: initialMileage,
    last_mileage_confirmed_at: initialMileage !== null ? now : null,
    last_mileage_reminder_at: null,
    created_at: now,
    updated_at: now
  };

  localDb.vehicles.push(vehicle);

  createSchedulesForVehicle(deviceId, vehicle.id, initialMileage, now, scheduleTemplates);

  return vehicle;
}

export async function ensureSchedulesExist(deviceId: string, vehicle: Vehicle) {
  const hasSchedules = localDb.schedules.some(
    (schedule) => schedule.device_id === deviceId && schedule.vehicle_id === vehicle.id
  );

  if (!hasSchedules) {
    const templates = await resolveTemplatesOrDefault(
      vehicle.year ?? null,
      vehicle.make,
      vehicle.model
    );

    createSchedulesForVehicle(
      deviceId,
      vehicle.id,
      vehicle.current_mileage ?? null,
      vehicle.created_at,
      templates
    );
  }
}

export async function getSchedules(deviceId: string) {
  return localDb.schedules
    .filter((schedule) => schedule.device_id === deviceId)
    .slice()
    .sort((a, b) => {
      const aDate = a.next_due_date ?? '';
      const bDate = b.next_due_date ?? '';
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      if (aDate && !bDate) {
        return -1;
      }
      if (!aDate && bDate) {
        return 1;
      }
      return a.service_name.localeCompare(b.service_name);
    });
}

export async function getServiceLogs(deviceId: string) {
  return localDb.serviceLogs
    .filter((log) => log.device_id === deviceId)
    .slice()
    .sort((a, b) => {
      if (a.service_date !== b.service_date) {
        return a.service_date > b.service_date ? -1 : 1;
      }
      return a.created_at > b.created_at ? -1 : 1;
    });
}

export async function createServiceLog(
  deviceId: string,
  vehicle: Vehicle,
  payload: CreateServiceLogPayload
) {
  const schedule = getScheduleById(payload.scheduleId);

  if (!schedule) {
    throw new Error('Schedule not found for service log.');
  }

  const nowIso = new Date().toISOString();
  const mileageValue = payload.mileage ?? null;
  const costCents =
    typeof payload.cost === 'number' && !Number.isNaN(payload.cost)
      ? Math.round(payload.cost * 100)
      : null;

  const log: ServiceLog = {
    id: randomUUID(),
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
  };

  localDb.serviceLogs.push(log);
  updateScheduleAfterService(schedule, payload);

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
  const nowIso = new Date().toISOString();
  const mileageValue = payload.mileage ?? null;
  const costCents =
    typeof payload.cost === 'number' && !Number.isNaN(payload.cost)
      ? Math.round(payload.cost * 100)
      : null;

  const log: ServiceLog = {
    id: randomUUID(),
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
  };

  localDb.serviceLogs.push(log);

  if (
    mileageValue !== null &&
    (vehicle.current_mileage === null || mileageValue > vehicle.current_mileage)
  ) {
    await updateVehicleMileage(vehicle.id, mileageValue);
  }
}

export async function updateVehicleMileage(vehicleId: string, mileage: number) {
  const vehicle = localDb.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return;
  }

  const now = new Date().toISOString();
  vehicle.current_mileage = mileage;
  vehicle.last_mileage_confirmed_at = now;
  vehicle.last_mileage_reminder_at = null;
  vehicle.updated_at = now;
}

export async function getVehiclesWithReminderContact() {
  return localDb.vehicles.filter((vehicle) => !!vehicle.contact_email);
}

export async function markScheduleReminderSent(
  scheduleId: string,
  status: MaintenanceStatus,
  sentAt: Date
) {
  const schedule = getScheduleById(scheduleId);
  if (!schedule) {
    return;
  }

  schedule.last_reminder_sent_at = sentAt.toISOString();
  schedule.last_reminder_status = status;
  schedule.updated_at = new Date().toISOString();
}

export async function markMileageReminderSent(vehicleId: string, sentAt: Date) {
  const vehicle = localDb.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return;
  }

  vehicle.last_mileage_reminder_at = sentAt.toISOString();
  vehicle.updated_at = sentAt.toISOString();
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
