# Manufacturer Maintenance Schedule Aggregation Job

## Goal
Design a backend job that continuously ingests and updates manufacturer-recommended maintenance schedules for vehicles sold in the United States so that AutoTrack can seed accurate default intervals and surface OEM-authenticated reminders.

## High-Level Overview
* **Job Type:** Server-side scheduled task executed daily (e.g., Supabase Edge Function with scheduled cron trigger or Vercel/Next.js cron job).
* **Primary Responsibilities:**
  1. Discover the authoritative maintenance documentation for each manufacturer/year/model/trim combination in scope.
  2. Extract structured service interval data, normalize it, and persist it in AutoTrack’s database.
  3. Detect changes in manufacturer schedules and update downstream caches and user-facing defaults.
  4. Emit observability signals (logging, metrics, alerts) for operational transparency.

## Data Sources
1. **OEM Owner Portals & Manuals (Primary)**
   * Manufacturer owner portals that expose VIN- or model-specific maintenance tables (e.g., Toyota Owners, Ford Owner, GM MyChevrolet).
   * Public PDF manuals and maintenance guides hosted on OEM sites.
2. **OEM API Integrations (Where Available)**
   * Some manufacturers expose authenticated APIs (e.g., Ford Developer Program) that provide maintenance schedule endpoints.
   * Use VIN-specific requests when API access exists; fall back to manual/portal scraping when not.
3. **Trusted Aggregators (Secondary)**
   * NHTSA data feeds, Consumer Reports, Edmunds maintenance APIs.
   * Treated as reference-only to validate OEM data and fill gaps when OEM sources are temporarily unavailable.

## Architecture Components
### 1. Scheduler & Execution Environment
* **Supabase Edge Function Cron** (recommended): Deploy aggregation logic as an Edge Function; use Supabase’s cron triggers to execute daily.
* Alternative: **Vercel Cron Job** invoking a Next.js API route that proxies into the same logic.
* Ensure idempotency: the job should be safe to rerun without duplicating records.

### 2. Data Harvesters (Source Adapters)
* Modular fetchers per manufacturer encapsulated in `lib/maintenance-scrapers/<manufacturer>.ts`.
* Each adapter implements a common interface:
  ```ts
  interface MaintenanceFetcher {
    supports: (vehicle: VehicleDescriptor) => boolean;
    fetchSchedule: (vehicle: VehicleDescriptor) => Promise<RawSchedule>;
  }
  ```
* Strategies per source type:
  * **API-backed OEMs:** Use OAuth/API keys stored in Supabase Vault or Vercel environment variables.
  * **Portal/PDF sources:** Employ headless browser scraping via Playwright (hosted separately) or PDF parsing through a lightweight worker queue.
  * **Aggregators:** HTTP clients with schema validation to ensure data quality.

### 3. Normalization & Mapping Layer
* Translate each `RawSchedule` into canonical service definitions aligned with AutoTrack’s schema (e.g., service codes `oil_change`, `tire_rotation`).
* Handle unit conversions (kilometers vs. miles) and conditional intervals (e.g., severe-service schedule) by tagging records with context flags.
* Derive `interval_months`, `interval_miles`, and `reminder_lead_*` defaults based on OEM guidance.

### 4. Persistence Layer
* **New Tables (Supabase PostgreSQL):**
  * `manufacturer_schedules`
    ```sql
    create table public.manufacturer_schedules (
      id uuid primary key default uuid_generate_v4(),
      manufacturer text not null,
      make text not null,
      model text not null,
      trim text,
      year smallint not null,
      schedule_hash text not null,
      source_url text not null,
      fetched_at timestamptz not null default timezone('utc', now()),
      valid_from date,
      valid_to date,
      metadata jsonb
    );
    create unique index manufacturer_schedule_unique
      on public.manufacturer_schedules (manufacturer, make, model, trim, year);
    ```
  * `manufacturer_services`
    ```sql
    create table public.manufacturer_services (
      id uuid primary key default uuid_generate_v4(),
      schedule_id uuid not null references public.manufacturer_schedules(id) on delete cascade,
      service_code text not null,
      service_name text not null,
      interval_months integer,
      interval_miles integer,
      conditions jsonb,
      notes text,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    );
    create index manufacturer_services_schedule_idx on public.manufacturer_services(schedule_id);
    ```
* **Change Detection:** Store a `schedule_hash` (e.g., SHA256 of normalized data) to detect updates; compare with prior runs to decide whether to overwrite.
* **Seeding User Defaults:** When a user registers a vehicle, query `manufacturer_services` for the best match and copy records into `service_schedules` with per-device overrides.

### 5. Orchestration Flow
1. **Fetch Pending Vehicles:** Gather canonical `VehicleDescriptor` entries from a lookup table (e.g., `supported_vehicle_catalog`).
2. **Dispatch to Fetchers:** Route each descriptor to the appropriate adapter; fan out using a lightweight queue (e.g., Supabase Task Queue or external worker) to avoid long-running cron invocations.
3. **Normalize & Hash:** Convert raw data, compute `schedule_hash`, and validate required fields.
4. **Upsert:** Insert/update `manufacturer_schedules` and `manufacturer_services` within a transaction.
5. **Invalidate Caches:** Publish a Supabase Realtime event or set a flag consumed by the Next.js app to refresh cached schedules.
6. **Metrics & Alerts:** Emit structured logs to Supabase Logflare; send alert when a fetcher fails consecutively or when a schedule changes.

### 6. Observability & Reliability
* **Logging:** Structured JSON logs with `vehicle`, `source`, `fetcher`, and `duration_ms`.
* **Metrics:** Track successes, failures, duration, and change counts via Prometheus-compatible endpoint or Logflare dashboards.
* **Alerting:** PagerDuty/Slack webhook when:
  * A manufacturer fetch fails for >3 consecutive days.
  * Schedule hash changes for safety-critical services (e.g., timing belt).
* **Rate Limits & Backoff:** Respect OEM portal ToS; use exponential backoff and caching to avoid banned IPs.
* **Data Quality Checks:** Validate intervals within reasonable bounds (e.g., oil change ≤ 25k miles); quarantine anomalous data for manual review.

### 7. Security & Compliance
* Store OEM credentials in secure secrets management (Supabase Vault, Vercel Encrypted Secrets).
* Ensure compliance with OEM terms; prefer officially documented APIs before scraping.
* Rate-limit requests per manufacturer; rotate user agents/IPs when scraping to mimic human browsing responsibly.

### 8. Integration Touchpoints in AutoTrack
* **Vehicle Onboarding:**
  * Extend onboarding flow to call a new API endpoint (e.g., `GET /api/schedules?year=2021&make=Toyota&model=Camry`) backed by `manufacturer_services`.
  * Prepopulate `service_schedules` rows per vehicle using fetched defaults.
* **Admin Dashboard:** Build a lightweight admin page to inspect manufacturer schedule freshness, view last fetch timestamp, and trigger manual refresh.
* **User Notifications:** Update reminder logic to prefer OEM intervals; fall back to legacy defaults if OEM data missing.

### 9. Daily Runbook
1. Cron trigger invokes aggregator edge function at 02:00 UTC.
2. Function enqueues jobs per manufacturer or per vehicle cohort.
3. Workers execute fetch-normalize-upsert pipeline.
4. Post-run summary (success counts, failures, updated schedules) pushed to Slack/email.
5. Alert on any failure anomalies for manual follow-up.

### 10. Future Enhancements
* Machine-learning layer to predict schedule deltas based on recall/TSB feeds.
* VIN decoding integration (e.g., NHTSA VIN API) to auto-enrich trim/engine details before fetching.
* Regionalization to include Canada/EU schedules with metric defaults.

## Implementation Checklist
- [ ] Create Supabase tables and indexes for manufacturer schedule storage.
- [ ] Define TypeScript interfaces for fetchers and normalized schedules.
- [ ] Build modular fetchers starting with top-selling brands (Toyota, Ford, GM, Honda, Nissan).
- [ ] Implement normalization + hashing pipeline.
- [ ] Set up Supabase Edge Function (or Vercel cron) that orchestrates fetching and persistence.
- [ ] Add observability (logging, metrics, alerts) and backoff handling.
- [ ] Integrate schedule lookup into vehicle onboarding flow and reminders.
- [ ] Document runbook and support procedures.
