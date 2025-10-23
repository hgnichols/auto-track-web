import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { MaintenanceCatalogEntry } from './types';

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'supabase', 'data', 'maintenance_catalog.json');
const LOCAL_CATALOG_EPOCH = '1970-01-01T00:00:00.000Z';

let cache: MaintenanceCatalogEntry[] | null = null;
let loadAttempted = false;

function normalizeCanonical(value: string) {
  return value.trim().toUpperCase();
}

function safeString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function loadMaintenanceCatalog(): Promise<MaintenanceCatalogEntry[]> {
  if (cache) {
    return cache;
  }

  if (loadAttempted) {
    return [];
  }

  loadAttempted = true;

  try {
    const fileContent = await readFile(LOCAL_CATALOG_FILE, 'utf8');
    const parsed = JSON.parse(fileContent) as { entries?: Array<Record<string, unknown>> };
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

    cache = entries
      .map((entry) => {
        const year = Number(entry.year);
        const makeRaw = safeString(entry.make);
        const makeDisplay = safeString(entry.make_display);
        const modelRaw = safeString(entry.model);
        const modelDisplay = safeString(entry.model_display);
        const serviceCode = safeString(entry.service_code);
        const serviceName = safeString(entry.service_name);

        if (
          !Number.isFinite(year) ||
          !makeRaw ||
          !modelRaw ||
          !serviceCode ||
          !serviceName ||
          !makeDisplay ||
          !modelDisplay
        ) {
          return null;
        }

        return {
          year,
          make: normalizeCanonical(makeRaw),
          make_display: makeDisplay,
          model: normalizeCanonical(modelRaw),
          model_display: modelDisplay,
          service_code: serviceCode,
          service_name: serviceName,
          category: safeString(entry.category),
          description: safeString(entry.description),
          interval_months: safeNumber(entry.interval_months),
          interval_miles: safeNumber(entry.interval_miles),
          first_due_mileage: safeNumber(entry.first_due_mileage),
          severity: safeString(entry.severity),
          source: safeString(entry.source),
          source_url: safeString(entry.source_url),
          created_at: LOCAL_CATALOG_EPOCH
        } satisfies MaintenanceCatalogEntry;
      })
      .filter((entry): entry is MaintenanceCatalogEntry => entry !== null);

    return cache;
  } catch (error) {
    console.error('Failed to load local maintenance catalog', error);
    cache = [];
    return cache;
  }
}

export async function getMaintenanceCatalogEntries(
  year: number,
  make: string,
  model: string
): Promise<MaintenanceCatalogEntry[]> {
  const catalog = await loadMaintenanceCatalog();
  const normalizedMake = normalizeCanonical(make);
  const normalizedModel = normalizeCanonical(model);

  return catalog
    .filter(
      (entry) =>
        entry.year === year &&
        entry.make === normalizedMake &&
        entry.model === normalizedModel
    )
    .sort((a, b) => {
      if (a.first_due_mileage !== b.first_due_mileage) {
        if (a.first_due_mileage === null) {
          return 1;
        }
        if (b.first_due_mileage === null) {
          return -1;
        }
        return a.first_due_mileage - b.first_due_mileage;
      }
      return a.service_name.localeCompare(b.service_name);
    });
}

export function __resetMaintenanceCatalogCacheForTests() {
  cache = null;
  loadAttempted = false;
}
