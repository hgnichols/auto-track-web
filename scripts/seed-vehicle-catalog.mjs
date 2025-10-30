#!/usr/bin/env node

/**
 * Upload the generated vehicle catalog JSON into Supabase/Postgres using the service role key.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-vehicle-catalog.mjs
 *
 * Optional flags:
 *   --file=path/to/catalog.json (defaults to supabase/data/vehicle_catalog.json)
 *   --batch=500 (number of rows per upsert)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_BATCH_SIZE = 500;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultCatalogPath = path.join(repoRoot, 'supabase', 'data', 'vehicle_catalog.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    file: defaultCatalogPath,
    batch: DEFAULT_BATCH_SIZE
  };

  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      const value = arg.split('=')[1];
      parsed.file = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
    } else if (arg.startsWith('--batch=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(value) && value > 0) {
        parsed.batch = value;
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

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function main() {
  const { file, batch } = parseArgs();
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  console.log(`Loading catalog from ${path.relative(repoRoot, file)}...`);
  const raw = await readFile(file, 'utf8');
  const parsed = JSON.parse(raw);

  let entries;
  if (Array.isArray(parsed)) {
    entries = parsed;
  } else if (Array.isArray(parsed.entries)) {
    entries = parsed.entries;
  } else {
    throw new Error(
      'Catalog JSON must be an array of entries or an object containing an `entries` array.'
    );
  }

  console.log(`Preparing to upsert ${entries.length} vehicle catalog rows (batch size ${batch}).`);

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });

  const chunks = chunk(entries, batch);
  let processed = 0;

  for (const [index, group] of chunks.entries()) {
    const payload = group.map((entry) => ({
      year: entry.year,
      make: entry.make,
      make_display: entry.make_display,
      model: entry.model,
      model_display: entry.model_display
    }));

    const { error } = await client.from('vehicle_catalog').upsert(payload, {
      onConflict: 'year,make,model'
    });

    if (error) {
      throw error;
    }

    processed += payload.length;
    console.log(
      `Batch ${index + 1}/${chunks.length} complete - total rows processed: ${processed}`
    );
  }

  console.log(`Vehicle catalog seed finished successfully. Rows processed: ${processed}.`);
}

main().catch((error) => {
  console.error('Vehicle catalog seed failed:', error);
  process.exitCode = 1;
});
