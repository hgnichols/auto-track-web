-- AutoTrack MVP schema
create extension if not exists "uuid-ossp";

create table if not exists public.devices (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references public.devices(id) on delete cascade,
  year smallint,
  make text not null,
  model text not null,
  vin text,
  contact_email text,
  current_mileage integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_unique_device unique (device_id)
);

create table if not exists public.service_schedules (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references public.devices(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_code text not null,
  service_name text not null,
  interval_months integer,
  interval_miles integer,
  reminder_lead_days integer,
  reminder_lead_miles integer,
  next_due_date date,
  next_due_mileage integer,
  last_completed_date date,
  last_completed_mileage integer,
  last_reminder_sent_at timestamptz,
  last_reminder_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_logs (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references public.devices(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  schedule_id uuid references public.service_schedules(id) on delete set null,
  service_code text,
  service_name text not null,
  service_date date not null,
  mileage integer,
  cost_cents integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_logs_vehicle_idx on public.service_logs(vehicle_id, service_date desc);
create index if not exists service_schedules_vehicle_idx on public.service_schedules(vehicle_id, next_due_date);
