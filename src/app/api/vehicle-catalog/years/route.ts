import { NextResponse } from 'next/server';
import { getVehicleCatalogYears } from '../../../../lib/repository';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    const years = await getVehicleCatalogYears();
    return NextResponse.json({ years });
  } catch (error) {
    console.error('Failed to load vehicle catalog years', error);
    return NextResponse.json({ error: 'Unable to load vehicle years.' }, { status: 500 });
  }
}
