export type Vehicle = {
  id: string;
  device_id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  current_mileage: number | null;
  created_at: string;
  updated_at: string;
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
