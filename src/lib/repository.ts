import * as localRepository from './repository.local';
import * as supabaseRepository from './repository.supabase';

type RepositoryModule = typeof localRepository;

const DATA_SOURCE =
  process.env.NEXT_PUBLIC_DATA_SOURCE ?? process.env.DATA_SOURCE ?? 'local';

const implementation: RepositoryModule = DATA_SOURCE === 'supabase'
  ? (supabaseRepository as RepositoryModule)
  : localRepository;

export const {
  getVehicleCatalogYears,
  getVehicleCatalogMakes,
  getVehicleCatalogModels,
  getVehicleCatalogEntry,
  ensureDevice,
  listVehicles,
  getVehicle,
  createVehicle,
  ensureSchedulesExist,
  getSchedules,
  getServiceLogs,
  getSchedule,
  updateScheduleDueDate,
  createServiceLog,
  createCustomServiceLog,
  updateVehicleMileage,
  getVehiclesWithReminderContact,
  markScheduleReminderSent,
  markMileageReminderSent,
  getDashboardData
} = implementation;
