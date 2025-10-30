import { cookies } from 'next/headers';

export const ACTIVE_VEHICLE_COOKIE_NAME = 'autotrack_active_vehicle_id';
export const ACTIVE_VEHICLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getActiveVehicleIdFromCookies() {
  const store = await cookies();
  const cookie = store.get(ACTIVE_VEHICLE_COOKIE_NAME);
  const value = cookie?.value?.trim();

  if (!value) {
    return null;
  }

  return value;
}

export function pickActiveVehicleId(
  desiredId: string | null | undefined,
  vehicles: { id: string }[]
) {
  if (vehicles.length === 0) {
    return null;
  }

  if (desiredId) {
    const match = vehicles.find((vehicle) => vehicle.id === desiredId);
    if (match) {
      return match.id;
    }
  }

  return vehicles[0]?.id ?? null;
}
