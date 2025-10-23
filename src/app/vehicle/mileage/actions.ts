'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { getVehicleByDevice, updateVehicleMileage } from '../../../lib/repository';

export async function submitMileageUpdateAction(formData: FormData) {
  const deviceId = requireDeviceId('/vehicle/mileage');
  const vehicle = await getVehicleByDevice(deviceId);

  if (!vehicle) {
    redirect('/onboarding');
  }

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
  revalidatePath('/vehicle/mileage');
  redirect('/');
}
