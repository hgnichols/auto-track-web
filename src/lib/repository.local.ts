import { randomUUID } from 'node:crypto';
import { addMonths, format } from 'date-fns';
import { DEFAULT_SERVICE_TEMPLATES, type ServiceTemplate } from './constants';
import type {
  DashboardData,
  MaintenanceStatus,
  ServiceLog,
  ServiceSchedule,
  Vehicle,
  VehicleCatalogEntry
} from './types';
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

const SEEDED_IDS = {
  devices: {
    alpha: 'f7f5a6d6-8f7e-4e84-b2ba-103097e3bc07',
    beta: '12d47a79-ef2c-4b74-8ce5-5ff1bd1e2e45',
    gamma: '56a9bf80-8faf-4e80-88e0-5e872f6298a4'
  },
  vehicles: {
    alpha: 'a1fb3a33-4244-4f89-830b-0b954d810e16',
    beta: '9e7a28d4-6672-4d98-9c5f-cc85de08a3b1',
    gamma: 'c95dd92b-0360-47c8-84c8-b4886217d9a7'
  },
  schedules: {
    alphaOil: '7222f2dd-54cf-4d41-aa07-e875886af8c3',
    alphaTires: 'ac7f06e2-4d5f-4095-9f37-9cefb5b2fc54',
    betaBrake: 'eb205cb1-5ad3-4899-9ed6-fbd86218b58b',
    gammaTrans: '391d4b70-f3aa-4935-90cc-d2e2c932a0b3',
    gammaCabin: '1ab7d6af-6e7b-4c77-8437-4e66b4a79e2f'
  },
  logs: {
    alpha1: 'd85d4e36-8ff6-41ee-9ed7-6ccd3bc6c492',
    alpha2: '36dcf6b2-2bf1-4a52-932c-f98c1a9c9403',
    beta1: '863b9d6a-4cc4-4a0c-9834-18a08d4a6f9b',
    gamma1: '6a6b82f4-14f2-4e36-b35c-bb6b004ccf03'
  }
} as const;

const initialDevices = Object.values(SEEDED_IDS.devices);

const localDb: LocalDatabase = {
  devices: new Set(initialDevices),
  vehicles: [
    {
      id: SEEDED_IDS.vehicles.alpha,
      device_id: SEEDED_IDS.devices.alpha,
      year: 2018,
      make: 'Toyota',
      model: 'Camry',
      vin: '4T1BF1FK0JU123456',
      contact_email: 'huntergenenichols@gmail.com',
      current_mileage: 45210,
      last_mileage_confirmed_at: '2024-05-04T15:45:00.000Z',
      last_mileage_reminder_at: '2024-04-15T10:30:00.000Z',
      created_at: '2023-10-02T09:15:00.000Z',
      updated_at: '2024-05-04T15:45:00.000Z'
    },
    {
      id: SEEDED_IDS.vehicles.beta,
      device_id: SEEDED_IDS.devices.beta,
      year: 2021,
      make: 'Ford',
      model: 'F-150',
      vin: '1FTFW1E58MFA12345',
      contact_email: 'huntergenenichols@gmail.com',
      current_mileage: 23650,
      last_mileage_confirmed_at: '2024-04-21T11:00:00.000Z',
      last_mileage_reminder_at: null,
      created_at: '2022-06-12T13:10:00.000Z',
      updated_at: '2024-04-21T11:00:00.000Z'
    },
    {
      id: SEEDED_IDS.vehicles.gamma,
      device_id: SEEDED_IDS.devices.gamma,
      year: 2015,
      make: 'Honda',
      model: 'CR-V',
      vin: '2HKRM4H77FH123456',
      contact_email: 'huntergenenichols@gmail.com',
      current_mileage: 98210,
      last_mileage_confirmed_at: '2024-03-30T08:20:00.000Z',
      last_mileage_reminder_at: '2024-02-28T07:50:00.000Z',
      created_at: '2021-01-20T16:40:00.000Z',
      updated_at: '2024-03-30T08:20:00.000Z'
    }
  ],
  schedules: [
    {
      id: SEEDED_IDS.schedules.alphaOil,
      device_id: SEEDED_IDS.devices.alpha,
      vehicle_id: SEEDED_IDS.vehicles.alpha,
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
      id: SEEDED_IDS.schedules.alphaTires,
      device_id: SEEDED_IDS.devices.alpha,
      vehicle_id: SEEDED_IDS.vehicles.alpha,
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
      id: SEEDED_IDS.schedules.betaBrake,
      device_id: SEEDED_IDS.devices.beta,
      vehicle_id: SEEDED_IDS.vehicles.beta,
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
      id: SEEDED_IDS.schedules.gammaTrans,
      device_id: SEEDED_IDS.devices.gamma,
      vehicle_id: SEEDED_IDS.vehicles.gamma,
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
      id: SEEDED_IDS.schedules.gammaCabin,
      device_id: SEEDED_IDS.devices.gamma,
      vehicle_id: SEEDED_IDS.vehicles.gamma,
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
      id: SEEDED_IDS.logs.alpha1,
      device_id: SEEDED_IDS.devices.alpha,
      vehicle_id: SEEDED_IDS.vehicles.alpha,
      schedule_id: SEEDED_IDS.schedules.alphaOil,
      service_code: 'OIL_CHANGE',
      service_name: 'Engine Oil & Filter',
      service_date: '2024-01-03',
      mileage: 41000,
      cost_cents: 8500,
      notes: 'Used synthetic oil. Checked fluids.',
      created_at: '2024-01-03T16:00:00.000Z'
    },
    {
      id: SEEDED_IDS.logs.alpha2,
      device_id: SEEDED_IDS.devices.alpha,
      vehicle_id: SEEDED_IDS.vehicles.alpha,
      schedule_id: SEEDED_IDS.schedules.alphaTires,
      service_code: 'TIRE_ROTATION',
      service_name: 'Tire Rotation',
      service_date: '2024-02-10',
      mileage: 43000,
      cost_cents: 4000,
      notes: 'Rotated and balanced tires.',
      created_at: '2024-02-10T18:20:00.000Z'
    },
    {
      id: SEEDED_IDS.logs.beta1,
      device_id: SEEDED_IDS.devices.beta,
      vehicle_id: SEEDED_IDS.vehicles.beta,
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
      id: SEEDED_IDS.logs.gamma1,
      device_id: SEEDED_IDS.devices.gamma,
      vehicle_id: SEEDED_IDS.vehicles.gamma,
      schedule_id: SEEDED_IDS.schedules.gammaCabin,
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

async function resolveTemplatesOrDefault(
  _year: number | null | undefined,
  _make: string,
  _model: string
): Promise<ScheduleTemplate[]> {
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

export async function listVehicles(deviceId: string) {
  return localDb.vehicles
    .filter((vehicle) => vehicle.device_id === deviceId)
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function getVehicle(deviceId: string, vehicleId: string) {
  return (
    localDb.vehicles.find(
      (vehicle) => vehicle.device_id === deviceId && vehicle.id === vehicleId
    ) ?? null
  );
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

export async function getSchedules(deviceId: string, vehicleId: string) {
  return localDb.schedules
    .filter(
      (schedule) => schedule.device_id === deviceId && schedule.vehicle_id === vehicleId
    )
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

export async function getServiceLogs(deviceId: string, vehicleId: string) {
  return localDb.serviceLogs
    .filter((log) => log.device_id === deviceId && log.vehicle_id === vehicleId)
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

  if (schedule.device_id !== deviceId || schedule.vehicle_id !== vehicle.id) {
    throw new Error('Schedule does not belong to the selected vehicle.');
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

export async function getDashboardData(
  deviceId: string,
  vehicleId: string | null = null
): Promise<DashboardData> {
  await ensureDevice(deviceId);

  const vehicles = await listVehicles(deviceId);

  if (vehicles.length === 0) {
    return {
      vehicles: [],
      activeVehicle: null,
      schedules: [],
      logs: []
    };
  }

  const activeVehicle =
    vehicleId !== null
      ? vehicles.find((candidate) => candidate.id === vehicleId) ?? vehicles[0]
      : vehicles[0];

  await ensureSchedulesExist(deviceId, activeVehicle);

  const [schedules, logs] = await Promise.all([
    getSchedules(deviceId, activeVehicle.id),
    getServiceLogs(deviceId, activeVehicle.id)
  ]);

  return {
    vehicles,
    activeVehicle,
    schedules,
    logs
  };
}
