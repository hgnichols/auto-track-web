-- Sample maintenance catalog seed data
-- Replace with generated content from scripts/generate-maintenance-catalog.mjs

insert into public.maintenance_catalog (
  year,
  make,
  make_display,
  model,
  model_display,
  service_code,
  service_name,
  category,
  description,
  interval_months,
  interval_miles,
  first_due_mileage,
  severity,
  source,
  source_url
)
values
  (
    2020,
    'TOYOTA',
    'Toyota',
    'CAMRY',
    'Camry',
    'replace-engine-oil-filter',
    'Replace engine oil and filter',
    'Maintenance',
    'Drain engine oil and replace oil filter with OEM specification components.',
    6,
    5000,
    5000,
    'normal',
    'CarMD Maintlist API',
    'https://api.carmd.com/v3.0/maintlist'
  ),
  (
    2020,
    'TOYOTA',
    'Toyota',
    'CAMRY',
    'Camry',
    'rotate-tires',
    'Rotate tires',
    'Maintenance',
    'Perform tire rotation in accordance with manufacturer lug torque specifications.',
    6,
    5000,
    5000,
    'normal',
    'CarMD Maintlist API',
    'https://api.carmd.com/v3.0/maintlist'
  ),
  (
    2020,
    'TOYOTA',
    'Toyota',
    'CAMRY',
    'Camry',
    'replace-cabin-air-filter',
    'Replace cabin air filter',
    'Maintenance',
    'Replace cabin air filter element; inspect HVAC intake for debris.',
    12,
    15000,
    15000,
    'normal',
    'CarMD Maintlist API',
    'https://api.carmd.com/v3.0/maintlist'
  )
on conflict (year, make, model, service_code) do update set
  service_name = excluded.service_name,
  category = excluded.category,
  description = excluded.description,
  interval_months = excluded.interval_months,
  interval_miles = excluded.interval_miles,
  first_due_mileage = excluded.first_due_mileage,
  severity = excluded.severity,
  source = excluded.source,
  source_url = excluded.source_url;
