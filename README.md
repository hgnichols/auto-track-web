# AutoTrack MVP

AutoTrack helps everyday drivers stay ahead of maintenance with a single, focused workflow: add your vehicle, log services, and keep an eye on what's due next. This repository contains the Next.js + Supabase implementation of the MVP described in `project.md`.

---

## Features
- **Dashboard:** Shows the next service due, highlights reminders, and surfaces the most recent maintenance log.
- **Vehicle Profile:** Capture year, make, model, VIN (optional), and mileage for one vehicle.
- **Maintenance Timeline:** Combined view of upcoming (due-soon / overdue) services and completed work.
- **Manufacturer Schedules:** Pull OEM-recommended maintenance intervals per year/make/model when available, falling back to sensible defaults.
- **Service Logging:** Log routine maintenance with mileage, cost, and notes; schedules update automatically.
- **Odometer Updates:** Adjust your current mileage whenever you like; reminders prompt you if the reading gets stale.
- **Smart Reminders:** Default intervals for oil change, tire rotation, and brake inspection drive the dashboard alerts.

The experience is designed for mobile screens, uses a single-device anonymous session (no sign-in), and keeps the navigation focused on three screens: Dashboard, Timeline, and Add Service.

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Provision Supabase**
   - Create a new Supabase project.
   - Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.
   - Generate the vehicle catalog data with `npm run generate:vehicle-catalog` (pass `--start-year` / `--end-year` flags if you want to limit the range).
   - Seed the catalog locally with `npm run seed:vehicle-catalog` (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment). This script streams the JSON into Supabase so you don't have to paste the large SQL file.
   - (Optional but recommended) Generate OEM maintenance schedules with `npm run generate:maintenance-catalog` after configuring the CarMD credentials described below. Seed them with `npm run seed:maintenance-catalog` to let onboarding pull real manufacturer guidance.
   - (Optional) Enable Row Level Security if you plan to move away from the service role in server actions.

3. **Environment variables**
   Create `.env.local` at the project root with:
   ```bash
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   RESEND_API_KEY=your-resend-api-key
   REMINDER_FROM_EMAIL=reminders@your-domain.com
   REMINDER_CRON_SECRET=super-secret-string
   REMINDER_APP_BASE_URL=http://localhost:3000
   # Optional: REMINDER_REPEAT_HOURS=24
   # Optional: MILEAGE_REMINDER_DAYS=30
   # Optional: REMINDER_TRIGGER_URL=https://your-domain.com/api/reminders/trigger
   # Optional: REMINDER_CRON_TIMEOUT_MS=35000
   CARMD_API_KEY=your-carmd-api-key
   CARMD_API_SECRET=your-carmd-api-secret
   CARMD_PARTNER_TOKEN=your-carmd-partner-token
   ```
   The app currently uses the service role inside server actions and never exposes it to the client. The public anon key is included for future client-side extensions. `RESEND_API_KEY` and the reminder settings power outbound maintenance reminder emails.
   CarMD credentials unlock the OEM maintenance ingestion script (`generate:maintenance-catalog`). Reach out to CarMD for API access and copy the Partner Token alongside your key + secret.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

5. **Schedule reminders**
   - Hit `POST /api/reminders/trigger` with the header `Authorization: Bearer $REMINDER_CRON_SECRET`.
   - `npm run cron:reminders` triggers the job manually and is safe to wire into any scheduler; the script defaults to `REMINDER_APP_BASE_URL` and accepts `REMINDER_TRIGGER_URL` when you need a fully-qualified target.
   - Configure a cron job (system cron, Vercel Cron, GitHub Actions, etc.) to call the script daily at 10am Eastern. Example crontab entry:
     ```
     CRON_TZ=America/New_York 0 10 * * * /usr/bin/env node /path/to/repo/scripts/run-reminder-job.mjs >> /var/log/autotrack-reminders.log 2>&1
     ```
     The handler sends maintenance reminders and mileage update nudges via Resend, de-duplicating sends with the last sent timestamp on each record.

---

## Application Flow

1. **Onboarding** (`/onboarding`)
   - Generates a per-device cookie to identify the session.
   - Captures vehicle details and seeds service schedules sourced from the manufacturer catalog when available. If no OEM schedule exists, one universal baseline is applied:
     | Service                          | Interval                | Reminder lead        |
     | -------------------------------- | ----------------------- | -------------------- |
     | Oil Change                       | 5,000 mi / 6 mo         | 500 mi / 14 d        |
     | Tire Rotation                    | 6,000 mi / 6 mo         | 500 mi / 14 d        |
     | Brake Inspection                 | 12 mo                   | 30 d                 |
     | Replace Engine Air Filter        | 15,000 mi / 24 mo       | 1,000 mi / 30 d      |
     | Replace Cabin Air Filter         | 15,000 mi / 12 mo       | 1,000 mi / 21 d      |
     | Brake Fluid Flush                | 24 mo                   | 21 d                 |
     | Coolant Flush & Replace          | 60,000 mi / 60 mo       | 1,000 mi / 45 d      |
     | Transmission Fluid Service       | 60,000 mi / 60 mo       | 1,000 mi / 45 d      |
     | Replace Spark Plugs              | 100,000 mi / 72 mo      | 5,000 mi / 45 d      |
     | Battery & Charging System Check  | 12 mo                   | 14 d                 |
     | Replace Wiper Blades             | 12 mo                   | 14 d                 |

2. **Dashboard** (`/`)
   - Highlights due-soon or overdue services.
   - Surfaces the closest upcoming schedule and the last completed log.

3. **Timeline** (`/timeline`)
   - Blends the upcoming reminders and completed logs in a vertical timeline.

4. **Add Service** (`/service/new`)
   - Logs a maintenance event, updates the relevant schedule, adjusts the vehicle mileage, and refreshes dashboard data.

---

## Key Directories

| Path | Description |
| ---- | ----------- |
| `src/app` | App Router routes, layouts, and server actions. |
| `src/lib` | Shared helpers for Supabase access, device identity, constants, and timeline calculations. |
| `supabase/schema.sql` | SQL migrations for the MVP database schema. |

---

## Supabase Notes

- The app uses server actions with the Supabase service role to simplify early MVP development. For production, consider moving to authenticated supabase-js clients with Row Level Security.
- `devices` table binds anonymous users to a single vehicle via an HTTP-only cookie (`autotrack_device_id`).
- `vehicle_catalog` stores normalized year/make/model combinations sourced from the NHTSA VPIC API via the provided generator script.
- `service_schedules` drives reminders and timelines; `service_logs` keeps the maintenance history.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run generate:vehicle-catalog` | Fetch the NHTSA VPIC catalog and emit Supabase seed files. |
| `npm run generate:maintenance-catalog` | Fetch OEM schedules via CarMD and emit Supabase seed files. |
| `npm run seed:vehicle-catalog` | Push the generated catalog JSON into Supabase via the service role. |
| `npm run seed:maintenance-catalog` | Push the generated maintenance catalog JSON into Supabase via the service role. |
| `npm run typecheck` | Static type checking with TypeScript. |

---

## Next Steps

- Connect actual reminder delivery (email/push) using Supabase Functions or a cron scheduler.
- Add offline caching or local storage fallbacks for when Supabase is unreachable.
- Expand to multi-vehicle support by relaxing the unique constraint on `vehicles.device_id` and adapting the UI. 
