'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { listVehicles, updateVehicleMileage } from '../../../lib/repository';
import { getActiveVehicleIdFromCookies, pickActiveVehicleId } from '../../../lib/vehicle-selection';

export async function submitMileageUpdateAction(formData: FormData) {
  const deviceId = await requireDeviceId('/vehicle/mileage');
  const onboardingRedirect = '/onboarding?mode=add&redirect=%2Fvehicle%2Fmileage';
  const vehicles = await listVehicles(deviceId);

  if (vehicles.length === 0) {
    redirect(onboardingRedirect);
  }

  const cookieVehicleId = await getActiveVehicleIdFromCookies();
  const formVehicleValue = formData.get('vehicle_id');
  const formVehicleId =
    typeof formVehicleValue === 'string' && formVehicleValue.trim().length > 0
      ? formVehicleValue.trim()
      : null;

  const targetVehicleId = pickActiveVehicleId(formVehicleId ?? cookieVehicleId, vehicles);

  if (!targetVehicleId) {
    redirect(onboardingRedirect);
  }

  const vehicle =
    vehicles.find((item) => item.id === targetVehicleId) ?? vehicles[0];

  const mileageValue = formData.get('current_mileage');
  const mileageRaw = typeof mileageValue === 'string' ? mileageValue.trim() : '';

  if (!mileageRaw) {
    throw new Error('Please enter your current mileage.');
  }

  const parsedMileage = Number.parseInt(mileageRaw, 10);

  if (!Number.isFinite(parsedMileage) || parsedMileage < 0) {
    throw new Error('Please enter a valid non-negative mileage.');
  }

  await updateVehicleMileage(vehicle.id, parsedMileage);

  revalidatePath('/');
  revalidatePath('/timeline');
  revalidatePath('/service/new');
  revalidatePath('/vehicle/mileage');
  redirect('/');
}
