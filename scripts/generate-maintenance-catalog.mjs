#!/usr/bin/env node

/**
 * Generate manufacturer maintenance schedules by year/make/model using the CarMD maintlist API.
 *
 * The script expects a populated vehicle catalog JSON file to determine which combinations to fetch.
 *
 * Required environment variables:
 *   CARMD_API_KEY
 *   CARMD_API_SECRET
 *   CARMD_PARTNER_TOKEN
 *
 * Optional CLI flags:
 *   --catalog=path/to/vehicle_catalog.json (defaults to supabase/data/vehicle_catalog.json)
 *   --output-json=path/to/output.json (defaults to supabase/data/maintenance_catalog.json)
 *   --output-sql=path/to/seeds.sql (defaults to supabase/seeds/maintenance_catalog.sql)
 *   --start-year=YYYY
 *   --end-year=YYYY
 *   --make=MAKE (case insensitive, matches canonical make value)
 *   --model=MODEL (case insensitive, matches canonical model value)
 *   --limit=number (limit combinations processed, useful for testing)
 *   --delay=ms (delay between API calls)
 *
 * Example:
 *   CARMD_API_KEY=... CARMD_API_SECRET=... CARMD_PARTNER_TOKEN=... \
 *     node scripts/generate-maintenance-catalog.mjs --start-year=2020 --make=Toyota
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.carmd.com/v3.0';
const DEFAULT_DELAY_MS = 200;
const DEFAULT_LIMIT = Number.POSITIVE_INFINITY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultVehicleCatalogPath = path.join(repoRoot, 'supabase', 'data', 'vehicle_catalog.json');
const defaultMaintenanceJsonPath = path.join(repoRoot, 'supabase', 'data', 'maintenance_catalog.json');
const defaultMaintenanceSqlPath = path.join(repoRoot, 'supabase', 'seeds', 'maintenance_catalog.sql');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeCanonical(value) {
  if (typeof value !== 'string') {
    return String(value ?? '').trim().toUpperCase();
  }
  return value.trim().toUpperCase();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    catalogPath: defaultVehicleCatalogPath,
    outputJsonPath: defaultMaintenanceJsonPath,
    outputSqlPath: defaultMaintenanceSqlPath,
    startYear: null,
    endYear: null,
    make: null,
    model: null,
    limit: DEFAULT_LIMIT,
    delayMs: DEFAULT_DELAY_MS
  };

  for (const arg of args) {
    if (arg.startsWith('--catalog=')) {
      const value = arg.split('=')[1];
      parsed.catalogPath = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
    } else if (arg.startsWith('--output-json=')) {
      const value = arg.split('=')[1];
      parsed.outputJsonPath = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
    } else if (arg.startsWith('--output-sql=')) {
      const value = arg.split('=')[1];
      parsed.outputSqlPath = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
    } else if (arg.startsWith('--start-year=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(value)) {
        parsed.startYear = value;
      }
    } else if (arg.startsWith('--end-year=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(value)) {
        parsed.endYear = value;
      }
    } else if (arg.startsWith('--make=')) {
      parsed.make = normalizeCanonical(arg.split('=')[1]);
    } else if (arg.startsWith('--model=')) {
      parsed.model = normalizeCanonical(arg.split('=')[1]);
    } else if (arg.startsWith('--limit=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(value) && value > 0) {
        parsed.limit = value;
      }
    } else if (arg.startsWith('--delay=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(value) && value >= 0) {
        parsed.delayMs = value;
      }
    }
  }

  return parsed;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function safeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadVehicleCatalogEntries(catalogPath) {
  const raw = await readFile(catalogPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.entries)) {
    throw new Error('Vehicle catalog JSON does not contain an `entries` array.');
  }

  return parsed.entries
    .map((entry) => ({
      year: Number(entry.year),
      make: normalizeCanonical(entry.make),
      make_display:
        typeof entry.make_display === 'string' && entry.make_display.trim().length > 0
          ? entry.make_display
          : entry.make,
      model: normalizeCanonical(entry.model),
      model_display:
        typeof entry.model_display === 'string' && entry.model_display.trim().length > 0
          ? entry.model_display
          : entry.model
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.year) &&
        typeof entry.make === 'string' &&
        entry.make.length > 0 &&
        typeof entry.model === 'string' &&
        entry.model.length > 0
    );
}

function buildAuthorizationHeader() {
  const apiKey = requireEnv('CARMD_API_KEY');
  const apiSecret = requireEnv('CARMD_API_SECRET');
  const basicToken = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return `Basic ${basicToken}`;
}

async function fetchMaintenanceList({ year, make, model, authHeader, partnerToken }) {
  const url = new URL(`${API_BASE}/maintlist`);
  url.searchParams.set('year', String(year));
  url.searchParams.set('make', make);
  url.searchParams.set('model', model);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: authHeader,
      'partner-token': partnerToken
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CarMD maintlist request failed with status ${response.status}: ${text}`);
  }

  const payload = await response.json();

  if (payload.code && payload.code !== 0) {
    throw new Error(`CarMD maintlist returned error code ${payload.code}: ${payload.message ?? 'unknown error'}`);
  }

  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data;
}

function buildServiceCode(serviceName, firstDueMileage) {
  const base = slugify(serviceName);
  if (!firstDueMileage || firstDueMileage <= 0) {
    return base;
  }
  return `${base}-${firstDueMileage}`;
}

function mapMaintenanceItem(entry, item) {
  const serviceName =
    typeof item.desc === 'string' && item.desc.trim().length > 0
      ? item.desc.trim()
      : typeof item.description === 'string'
      ? item.description.trim()
      : null;

  if (!serviceName) {
    return null;
  }

  const firstDueMileage =
    safeNumber(item.first_due_mileage) ??
    safeNumber(item.due_mileage) ??
    safeNumber(item.schedule_mileage);

  const intervalMiles =
    safeNumber(item.schedule_interval_miles) ??
    safeNumber(item.interval_miles) ??
    safeNumber(item.recurrence_miles);

  const intervalMonths =
    safeNumber(item.schedule_interval_months) ??
    safeNumber(item.interval_months) ??
    safeNumber(item.recurrence_months);

  return {
    year: entry.year,
    make: entry.make,
    make_display: entry.make_display,
    model: entry.model,
    model_display: entry.model_display,
    service_code: buildServiceCode(serviceName, firstDueMileage),
    service_name: serviceName,
    category:
      typeof item.category === 'string' && item.category.trim().length > 0
        ? item.category.trim()
        : null,
    description:
      typeof item.repair_details === 'string' && item.repair_details.trim().length > 0
        ? item.repair_details.trim()
        : typeof item.notes === 'string' && item.notes.trim().length > 0
        ? item.notes.trim()
        : null,
    interval_months: intervalMonths ?? null,
    interval_miles: intervalMiles ?? null,
    first_due_mileage: firstDueMileage ?? null,
    severity:
      typeof item.severity === 'string' && item.severity.trim().length > 0
        ? item.severity.trim()
        : typeof item.due_status === 'string' && item.due_status.trim().length > 0
        ? item.due_status.trim()
        : null,
    source: 'CarMD Maintlist API',
    source_url: `${API_BASE}/maintlist`
  };
}

function escapeSqlLiteral(value) {
  return value.replace(/'/g, "''");
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'null';
  }

  return `'${escapeSqlLiteral(String(value))}'`;
}

function buildInsertStatement(rows) {
  const values = rows
    .map(
      (row) =>
        `(${row.year}, ${sqlLiteral(row.make)}, ${sqlLiteral(row.make_display)}, ${sqlLiteral(row.model)}, ${sqlLiteral(row.model_display)}, ${sqlLiteral(row.service_code)}, ${sqlLiteral(row.service_name)}, ${sqlLiteral(row.category)}, ${sqlLiteral(row.description)}, ${sqlLiteral(row.interval_months)}, ${sqlLiteral(row.interval_miles)}, ${sqlLiteral(row.first_due_mileage)}, ${sqlLiteral(row.severity)}, ${sqlLiteral(row.source)}, ${sqlLiteral(row.source_url)})`
    )
    .join(',\n  ');

  return `insert into public.maintenance_catalog (
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
) values
  ${values}
on conflict (year, make, model, service_code) do update set
  service_name = excluded.service_name,
  category = excluded.category,
  description = excluded.description,
  interval_months = excluded.interval_months,
  interval_miles = excluded.interval_miles,
  first_due_mileage = excluded.first_due_mileage,
  severity = excluded.severity,
  source = excluded.source,
  source_url = excluded.source_url;`;
}

async function writeSqlSeed(entries, outputPath) {
  const chunkSize = 200;
  const chunks = [];

  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(buildInsertStatement(entries.slice(i, i + chunkSize)));
  }

  const content = `-- Generated maintenance catalog seed data
-- Source: CarMD Maintlist API (https://api.carmd.com/v3.0/maintlist)
-- Generated at ${new Date().toISOString()}

${chunks.join('\n\n')}
`;

  await writeFile(outputPath, content, 'utf8');
}

async function main() {
  const {
    catalogPath,
    outputJsonPath,
    outputSqlPath,
    startYear,
    endYear,
    make,
    model,
    limit,
    delayMs
  } = parseArgs();

  const authHeader = buildAuthorizationHeader();
  const partnerToken = requireEnv('CARMD_PARTNER_TOKEN');

  console.log(`Loading vehicle catalog from ${path.relative(repoRoot, catalogPath)}...`);
  const vehicleEntries = await loadVehicleCatalogEntries(catalogPath);

  const filteredEntries = vehicleEntries
    .filter((entry) => (startYear ? entry.year >= startYear : true))
    .filter((entry) => (endYear ? entry.year <= endYear : true))
    .filter((entry) => (make ? entry.make === make : true))
    .filter((entry) => (model ? entry.model === model : true))
    .slice(0, limit);

  console.log(`Processing ${filteredEntries.length} year/make/model combinations...`);

  const allEntries = [];
  let processed = 0;

  for (const entry of filteredEntries) {
    console.log(
      `Fetching maintenance schedule for ${entry.year} ${entry.make_display} ${entry.model_display}...`
    );

    try {
      const data = await fetchMaintenanceList({
        year: entry.year,
        make: entry.make,
        model: entry.model,
        authHeader,
        partnerToken
      });

      if (!data.length) {
        console.warn(
          `No maintenance items returned for ${entry.year} ${entry.make_display} ${entry.model_display}`
        );
      }

      for (const item of data) {
        const mapped = mapMaintenanceItem(entry, item);
        if (mapped) {
          allEntries.push(mapped);
        }
      }
    } catch (error) {
      console.error(
        `Failed to fetch maintenance for ${entry.year} ${entry.make_display} ${entry.model_display}:`,
        error
      );
    }

    processed += 1;

    if (processed < filteredEntries.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const uniqueKey = new Set();
  const deduped = [];

  for (const entry of allEntries) {
    const key = `${entry.year}|${entry.make}|${entry.model}|${entry.service_code}`;
    if (!uniqueKey.has(key)) {
      uniqueKey.add(key);
      deduped.push(entry);
    }
  }

  console.log(`Collected ${deduped.length} maintenance schedule rows.`);

  const outputDir = path.dirname(outputJsonPath);
  const seedDir = path.dirname(outputSqlPath);
  await mkdir(outputDir, { recursive: true });
  await mkdir(seedDir, { recursive: true });

  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    source: 'CarMD Maintlist API',
    count: deduped.length,
    entries: deduped
  };

  await writeFile(outputJsonPath, JSON.stringify(jsonPayload, null, 2), 'utf8');
  console.log(`Wrote JSON catalog to ${path.relative(repoRoot, outputJsonPath)}`);

  if (deduped.length > 0) {
    await writeSqlSeed(deduped, outputSqlPath);
    console.log(`Wrote SQL seed to ${path.relative(repoRoot, outputSqlPath)}`);
  } else {
    console.warn('No entries generated; skipping SQL seed output.');
  }

  console.log('Maintenance catalog generation completed.');
}

main().catch((error) => {
  console.error('Maintenance catalog generation failed:', error);
  process.exitCode = 1;
});
