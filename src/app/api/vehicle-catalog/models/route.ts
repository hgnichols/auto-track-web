import { NextRequest, NextResponse } from 'next/server';
import { getVehicleCatalogModels } from '../../../../lib/repository';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawYear = searchParams.get('year') ?? '';
  const rawMake = searchParams.get('make') ?? '';
  const year = Number.parseInt(rawYear, 10);
  const make = rawMake.trim();

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'Missing or invalid year parameter.' }, { status: 400 });
  }

  if (!make) {
    return NextResponse.json({ error: 'Missing make parameter.' }, { status: 400 });
  }

  try {
    const models = await getVehicleCatalogModels(year, make);
    return NextResponse.json({
      models: models.map((model) => ({
        value: model.model,
        label: model.model_display
      }))
    });
  } catch (error) {
    console.error('Failed to load vehicle catalog models', error);
    return NextResponse.json({ error: 'Unable to load vehicle models.' }, { status: 500 });
  }
}
