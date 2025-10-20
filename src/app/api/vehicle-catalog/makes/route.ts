import { NextRequest, NextResponse } from 'next/server';
import { getVehicleCatalogMakes } from '../../../../lib/repository';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawYear = searchParams.get('year') ?? '';
  const year = Number.parseInt(rawYear, 10);

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'Missing or invalid year parameter.' }, { status: 400 });
  }

  try {
    const makes = await getVehicleCatalogMakes(year);
    return NextResponse.json({
      makes: makes.map((make) => ({
        value: make.make,
        label: make.make_display
      }))
    });
  } catch (error) {
    console.error('Failed to load vehicle catalog makes', error);
    return NextResponse.json({ error: 'Unable to load vehicle makes.' }, { status: 500 });
  }
}
