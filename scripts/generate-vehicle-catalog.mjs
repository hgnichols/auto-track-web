#!/usr/bin/env node

/**
 * Generate a comprehensive vehicle catalog for US passenger cars using the public NHTSA VPIC API.
 * The script writes two artifacts:
 *   - supabase/data/vehicle_catalog.json
 *   - supabase/seeds/vehicle_catalog.sql
 *
 * The SQL seed file can be executed against the Supabase/Postgres database to populate the catalog table.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_START_YEAR = 1990;
const DEFAULT_END_YEAR = new Date().getFullYear();
const CONCURRENCY = 4;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_DELAY_MS = 200;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'supabase', 'data');
const seedsDir = path.join(repoRoot, 'supabase', 'seeds');
const jsonOutputPath = path.join(dataDir, 'vehicle_catalog.json');
const sqlOutputPath = path.join(seedsDir, 'vehicle_catalog.sql');

const apiBase = 'https://vpic.nhtsa.dot.gov/api/vehicles';

function parseYear(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const cliArgs = process.argv.slice(2);
let startYear = DEFAULT_START_YEAR;
let endYear = DEFAULT_END_YEAR;

for (const arg of cliArgs) {
  if (arg.startsWith('--start-year=')) {
    startYear = parseYear(arg.split('=')[1], startYear);
  } else if (arg.startsWith('--end-year=')) {
    endYear = parseYear(arg.split('=')[1], endYear);
  }
}

const normalizedStartYear = Math.max(1900, Math.min(startYear, DEFAULT_END_YEAR));
const normalizedEndYear = Math.max(normalizedStartYear, Math.min(endYear, DEFAULT_END_YEAR));

console.log(
  `Generating vehicle catalog for model years ${normalizedStartYear}-${normalizedEndYear} (requested ${startYear}-${endYear}).`
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCanonical(value) {
  return normalizeWhitespace(value).toUpperCase();
}

function formatVehicleName(value) {
  const trimmed = normalizeWhitespace(value);
  return trimmed
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (segment) => {
      if (/^\d+$/.test(segment)) {
        return segment;
      }
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    });
}

async function fetchJsonWithRetry(url, attempts = RETRY_LIMIT) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'auto-track catalog generator (+https://github.com/)',
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }
      const backoff = RETRY_DELAY_MS * attempt;
      console.warn(`Retrying ${url} after ${backoff}ms due to error: ${error.message}`);
      await sleep(backoff);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${attempts} attempts`);
}

async function loadMakes() {
  const url = `${apiBase}/GetMakesForVehicleType/car?format=json`;
  const data = await fetchJsonWithRetry(url);
  if (!Array.isArray(data.Results)) {
    throw new Error('Unexpected response when loading makes');
  }
  const makes = Array.from(
    new Set(
      data.Results.map((item) => normalizeWhitespace(item.MakeName ?? item.Make_Name ?? ''))
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  console.log(`Loaded ${makes.length} passenger car makes from NHTSA.`);
  return makes;
}

async function runWithConcurrency(items, limit, worker) {
  let index = 0;
  const total = items.length;

  const runners = Array.from({ length: Math.min(limit, total) }, async () => {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= total) {
        break;
      }
      const item = items[currentIndex];
      await worker(item);
      if (REQUEST_DELAY_MS > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  });

  await Promise.all(runners);
}

function buildInsertStatement(rows) {
  const values = rows
    .map(
      (row) =>
        `(${row.year}, '${row.makeSql}', '${row.makeDisplaySql}', '${row.modelSql}', '${row.modelDisplaySql}')`
    )
    .join(',\n  ');

  return `insert into public.vehicle_catalog (year, make, make_display, model, model_display)\nvalues\n  ${values}\non conflict (year, make, model) do update set make_display = excluded.make_display, model_display = excluded.model_display;`;
}

function escapeSqlLiteral(value) {
  return value.replace(/'/g, "''");
}

async function main() {
  const makes = await loadMakes();
  const catalogMap = new Map();
  const currentYear = normalizedEndYear;

  for (let year = normalizedStartYear; year <= currentYear; year += 1) {
    console.log(`Processing model year ${year}...`);
    await runWithConcurrency(makes, CONCURRENCY, async (makeRaw) => {
      const makeCanonical = normalizeCanonical(makeRaw);
      const url = `${apiBase}/GetModelsForMakeYear/make/${encodeURIComponent(
        makeCanonical
      )}/modelyear/${year}?format=json`;

      try {
        const data = await fetchJsonWithRetry(url);
        if (!Array.isArray(data.Results) || data.Results.length === 0) {
          return;
        }

        for (const result of data.Results) {
          const modelRaw = result.Model_Name ?? result.ModelName ?? '';
          const normalizedModel = normalizeWhitespace(modelRaw);
          if (!normalizedModel) {
            continue;
          }

          const modelCanonical = normalizeCanonical(normalizedModel);
          const key = `${year}|${makeCanonical}|${modelCanonical}`;

          if (catalogMap.has(key)) {
            continue;
          }

          const makeDisplay = formatVehicleName(makeCanonical);
          const modelDisplay = formatVehicleName(normalizedModel);

          catalogMap.set(key, {
            year,
            make: makeCanonical,
            make_display: makeDisplay,
            model: modelCanonical,
            model_display: modelDisplay
          });
        }
      } catch (error) {
        console.error(`Failed to load models for ${makeCanonical} ${year}: ${error.message}`);
      }
    });
  }

  const entries = Array.from(catalogMap.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    if (a.make !== b.make) {
      return a.make.localeCompare(b.make);
    }
    return a.model.localeCompare(b.model);
  });

  console.log(`Collected ${entries.length} year/make/model combinations.`);

  await mkdir(dataDir, { recursive: true });
  await mkdir(seedsDir, { recursive: true });

  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    source: 'NHTSA VPIC API',
    startYear: normalizedStartYear,
    endYear: currentYear,
    count: entries.length,
    entries
  };

  await writeFile(jsonOutputPath, JSON.stringify(jsonPayload, null, 2), 'utf8');
  console.log(`Wrote JSON catalog to ${path.relative(repoRoot, jsonOutputPath)}`);

  const chunkSize = 500;
  const insertChunks = [];

  for (let i = 0; i < entries.length; i += chunkSize) {
    const slice = entries.slice(i, i + chunkSize).map((entry) => ({
      year: entry.year,
      makeSql: escapeSqlLiteral(entry.make),
      makeDisplaySql: escapeSqlLiteral(entry.make_display),
      modelSql: escapeSqlLiteral(entry.model),
      modelDisplaySql: escapeSqlLiteral(entry.model_display)
    }));
    insertChunks.push(buildInsertStatement(slice));
  }

  const sqlContent = `-- Generated vehicle catalog seed data\n-- Source: NHTSA VPIC API (https://vpic.nhtsa.dot.gov/)\n-- Generated at ${new Date().toISOString()}\n\n${insertChunks.join('\n\n')}\n`;
  await writeFile(sqlOutputPath, sqlContent, 'utf8');
  console.log(`Wrote SQL seed to ${path.relative(repoRoot, sqlOutputPath)}`);

  console.log('Vehicle catalog generation completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
