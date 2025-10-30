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
  last_mileage_confirmed_at timestamptz,
  last_mileage_reminder_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_unique_device unique (device_id)
);

create table if not exists public.vehicle_catalog (
  year smallint not null,
  make text not null,
  make_display text not null,
  model text not null,
  model_display text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint vehicle_catalog_pkey primary key (year, make, model)
);

create index if not exists vehicle_catalog_year_idx on public.vehicle_catalog(year);
create index if not exists vehicle_catalog_make_idx on public.vehicle_catalog(make);
create index if not exists vehicle_catalog_model_idx on public.vehicle_catalog(model);

create or replace function public.get_vehicle_catalog_years()
returns table (year smallint)
language sql
stable
as $$
  select distinct vc.year
  from public.vehicle_catalog vc
  order by vc.year desc;
$$;

create or replace function public.get_vehicle_catalog_makes(p_year smallint)
returns table (make text, make_display text)
language sql
stable
as $$
  select distinct vc.make, vc.make_display
  from public.vehicle_catalog vc
  where vc.year = p_year
  order by vc.make_display asc;
$$;

create or replace function public.get_vehicle_catalog_models(p_year smallint, p_make text)
returns table (model text, model_display text)
language sql
stable
as $$
  select distinct vc.model, vc.model_display
  from public.vehicle_catalog vc
  where vc.year = p_year
    and vc.make = p_make
  order by vc.model_display asc;
$$;

create or replace function public.get_vehicle_catalog_entry(p_year smallint, p_make text, p_model text)
returns public.vehicle_catalog
language sql
stable
as $$
  select vc.*
  from public.vehicle_catalog vc
  where vc.year = p_year
    and vc.make = p_make
    and vc.model = p_model
  limit 1;
$$;

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
