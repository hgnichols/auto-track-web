'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { requireDeviceId } from '../../lib/device';
import { getVehicle } from '../../lib/repository';
import {
  ACTIVE_VEHICLE_COOKIE_MAX_AGE,
  ACTIVE_VEHICLE_COOKIE_NAME
} from '../../lib/vehicle-selection';

const REVALIDATE_TARGETS = ['/', '/timeline', '/service/new', '/vehicle/mileage'];

export async function selectVehicleAction(vehicleId: string, returnPath: string) {
  const sanitizedVehicleId = vehicleId?.trim();

  if (!sanitizedVehicleId) {
    throw new Error('Vehicle id is required.');
  }

  const safeReturnPath = returnPath?.startsWith('/') ? returnPath : '/';
  const deviceId = await requireDeviceId(safeReturnPath);
  const vehicle = await getVehicle(deviceId, sanitizedVehicleId);

  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  const store = await cookies();
  store.set({
    name: ACTIVE_VEHICLE_COOKIE_NAME,
    value: vehicle.id,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACTIVE_VEHICLE_COOKIE_MAX_AGE
  });

  for (const target of REVALIDATE_TARGETS) {
    revalidatePath(target);
  }

  if (!REVALIDATE_TARGETS.includes(safeReturnPath)) {
    revalidatePath(safeReturnPath);
  }
}
