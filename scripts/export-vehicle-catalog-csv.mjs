#!/usr/bin/env node

/**
 * Convert the generated vehicle catalog JSON file into a CSV that Supabase can import.
 *
 * Usage:
 *   node scripts/export-vehicle-catalog-csv.mjs
 *
 * Optional flags:
 *   --json=path/to/source.json  (defaults to supabase/data/vehicle_catalog.json)
 *   --csv=path/to/output.csv    (defaults to supabase/data/vehicle_catalog.csv)
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultJsonPath = path.join(repoRoot, 'supabase', 'data', 'vehicle_catalog.json');
const defaultCsvPath = path.join(repoRoot, 'supabase', 'data', 'vehicle_catalog.csv');

function resolveOption(value, fallback) {
  if (!value) {
    return fallback;
  }
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    json: defaultJsonPath,
    csv: defaultCsvPath
  };

  for (const arg of args) {
    if (arg.startsWith('--json=')) {
      options.json = resolveOption(arg.split('=')[1], defaultJsonPath);
    } else if (arg.startsWith('--csv=')) {
      options.csv = resolveOption(arg.split('=')[1], defaultCsvPath);
    }
  }

  return options;
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '');
  if (stringValue === '') {
    return '';
  }
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function main() {
  const { json, csv } = parseArgs();

  console.log(`Reading catalog JSON from ${path.relative(repoRoot, json)}...`);
  const raw = await readFile(json, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error('Catalog JSON does not contain an `entries` array.');
  }

  const header = ['year', 'make', 'make_display', 'model', 'model_display'];
  const rows = parsed.entries.map((entry) =>
    [
      escapeCsvValue(entry.year),
      escapeCsvValue(entry.make),
      escapeCsvValue(entry.make_display),
      escapeCsvValue(entry.model),
      escapeCsvValue(entry.model_display)
    ].join(',')
  );

  const csvContent = [header.join(','), ...rows].join('\n');
  await writeFile(csv, csvContent, 'utf8');
  console.log(`Wrote CSV to ${path.relative(repoRoot, csv)} (${rows.length} rows).`);
}

main().catch((error) => {
  console.error('Failed to export vehicle catalog CSV:', error);
  process.exitCode = 1;
});
