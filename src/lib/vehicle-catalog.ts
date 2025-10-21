import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { VehicleCatalogEntry } from './types';

const LOCAL_CATALOG_FILE = path.join(process.cwd(), 'supabase', 'data', 'vehicle_catalog.json');
const LOCAL_CATALOG_EPOCH = '1970-01-01T00:00:00.000Z';

let catalogCache: VehicleCatalogEntry[] | null = null;
let loadAttempted = false;

function normalizeCatalogValue(raw: string) {
  return raw.trim().toUpperCase();
}

async function loadVehicleCatalog(): Promise<VehicleCatalogEntry[]> {
  if (catalogCache) {
    return catalogCache;
  }

  if (loadAttempted) {
    return [];
  }

  loadAttempted = true;

  try {
    const fileContent = await readFile(LOCAL_CATALOG_FILE, 'utf8');
    const parsed = JSON.parse(fileContent) as { entries?: Array<Record<string, unknown>> };
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

    catalogCache = entries
      .map((entry) => {
        const year = Number(entry.year);
        const make = typeof entry.make === 'string' ? normalizeCatalogValue(entry.make) : '';
        const makeDisplay = typeof entry.make_display === 'string' ? entry.make_display : '';
        const model = typeof entry.model === 'string' ? normalizeCatalogValue(entry.model) : '';
        const modelDisplay = typeof entry.model_display === 'string' ? entry.model_display : '';

        if (!Number.isFinite(year) || !make || !model) {
          return null;
        }

        return {
          year,
          make,
          make_display: makeDisplay,
          model,
          model_display: modelDisplay,
          created_at: LOCAL_CATALOG_EPOCH
        } satisfies VehicleCatalogEntry;
      })
      .filter((entry): entry is VehicleCatalogEntry => entry !== null);

    return catalogCache;
  } catch (error) {
    console.error('Failed to load local vehicle catalog', error);
    catalogCache = [];
    return catalogCache;
  }
}

export async function getVehicleCatalogYears(): Promise<number[]> {
  const catalog = await loadVehicleCatalog();
  const years = new Set<number>();
  for (const entry of catalog) {
    years.add(entry.year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export async function getVehicleCatalogMakes(year: number) {
  const catalog = await loadVehicleCatalog();
  const makes = new Map<string, { make: string; make_display: string }>();
  for (const entry of catalog) {
    if (entry.year === year && !makes.has(entry.make)) {
      makes.set(entry.make, {
        make: entry.make,
        make_display: entry.make_display
      });
    }
  }

  return Array.from(makes.values()).sort((a, b) => a.make_display.localeCompare(b.make_display));
}

export async function getVehicleCatalogModels(year: number, make: string) {
  const catalog = await loadVehicleCatalog();
  const normalizedMake = normalizeCatalogValue(make);
  const models = new Map<string, { model: string; model_display: string }>();

  for (const entry of catalog) {
    if (entry.year === year && entry.make === normalizedMake && !models.has(entry.model)) {
      models.set(entry.model, {
        model: entry.model,
        model_display: entry.model_display
      });
    }
  }

  return Array.from(models.values()).sort((a, b) => a.model_display.localeCompare(b.model_display));
}

export async function getVehicleCatalogEntry(
  year: number,
  make: string,
  model: string
): Promise<VehicleCatalogEntry | null> {
  const catalog = await loadVehicleCatalog();
  const normalizedMake = normalizeCatalogValue(make);
  const normalizedModel = normalizeCatalogValue(model);

  return (
    catalog.find(
      (entry) => entry.year === year && entry.make === normalizedMake && entry.model === normalizedModel
    ) ?? null
  );
}

export function __resetCatalogCacheForTests() {
  catalogCache = null;
  loadAttempted = false;
}
