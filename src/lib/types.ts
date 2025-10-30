export type MaintenanceStatus = 'ok' | 'due_soon' | 'overdue';

export type Vehicle = {
  id: string;
  device_id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  contact_email: string | null;
  current_mileage: number | null;
  last_mileage_confirmed_at: string | null;
  last_mileage_reminder_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleCatalogEntry = {
  year: number;
  make: string;
  make_display: string;
  model: string;
  model_display: string;
  created_at: string;
};

export type ServiceSchedule = {
  id: string;
  device_id: string;
  vehicle_id: string;
  service_code: string;
  service_name: string;
  interval_months: number | null;
  interval_miles: number | null;
  reminder_lead_days: number | null;
  reminder_lead_miles: number | null;
  next_due_date: string | null;
  next_due_mileage: number | null;
  last_completed_date: string | null;
  last_completed_mileage: number | null;
  last_reminder_sent_at: string | null;
  last_reminder_status: MaintenanceStatus | null;
  created_at: string;
  updated_at: string;
};

export type ServiceLog = {
  id: string;
  device_id: string;
  vehicle_id: string;
  schedule_id: string | null;
  service_code: string | null;
  service_name: string;
  service_date: string;
  mileage: number | null;
  cost_cents: number | null;
  notes: string | null;
  created_at: string;
};

export type DashboardData = {
  vehicle: Vehicle;
  schedules: ServiceSchedule[];
  logs: ServiceLog[];
};
