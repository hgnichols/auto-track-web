'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { createServiceLog, getVehicleByDevice } from '../../../lib/repository';

export async function submitServiceAction(formData: FormData) {
  const deviceId = requireDeviceId('/service/new');
  const vehicle = await getVehicleByDevice(deviceId);

  if (!vehicle) {
    redirect('/onboarding');
  }

  const scheduleId = String(formData.get('schedule_id') ?? '');
  const serviceDate = String(formData.get('service_date') ?? '').trim();

  if (!scheduleId) {
    throw new Error('Service type is required.');
  }

  if (!serviceDate) {
    throw new Error('Service date is required.');
  }

  const mileageValue = formData.get('mileage');
  const costValue = formData.get('cost');
  const notesValue = formData.get('notes');

  const mileage =
    typeof mileageValue === 'string' && mileageValue.trim().length > 0
      ? Number(mileageValue)
      : null;

  const cost =
    typeof costValue === 'string' && costValue.trim().length > 0
      ? Number.parseFloat(costValue)
      : null;

  await createServiceLog(deviceId, vehicle, {
    scheduleId,
    serviceDate,
    mileage: Number.isFinite(mileage) ? mileage : null,
    cost: Number.isFinite(cost) ? cost : null,
    notes: typeof notesValue === 'string' ? notesValue : null
  });

  revalidatePath('/');
  revalidatePath('/timeline');
  redirect('/');
}
