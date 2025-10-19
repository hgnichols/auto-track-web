'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../lib/device';
import { createCustomServiceLog, createServiceLog, getVehicleByDevice } from '../../../lib/repository';

export async function submitServiceAction(formData: FormData) {
  const deviceId = requireDeviceId('/service/new');
  const vehicle = await getVehicleByDevice(deviceId);

  if (!vehicle) {
    redirect('/onboarding');
  }

  const serviceSelection = String(formData.get('schedule_id') ?? '').trim();
  const serviceDate = String(formData.get('service_date') ?? '').trim();

  if (!serviceSelection) {
    throw new Error('Service type is required.');
  }

  if (!serviceDate) {
    throw new Error('Service date is required.');
  }

  const isCustom = serviceSelection === 'custom';
  const customServiceValue = formData.get('custom_service_name');
  const customServiceName =
    typeof customServiceValue === 'string' ? customServiceValue.trim() : '';
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

  const sanitizedMileage = Number.isFinite(mileage) ? mileage : null;
  const sanitizedCost = Number.isFinite(cost) ? cost : null;
  const sanitizedNotes = typeof notesValue === 'string' ? notesValue : null;

  if (isCustom) {
    if (!customServiceName) {
      throw new Error('Service name is required for custom logs.');
    }

    await createCustomServiceLog(deviceId, vehicle, {
      serviceName: customServiceName,
      serviceDate,
      mileage: sanitizedMileage,
      cost: sanitizedCost,
      notes: sanitizedNotes
    });
  } else {
    await createServiceLog(deviceId, vehicle, {
      scheduleId: serviceSelection,
      serviceDate,
      mileage: sanitizedMileage,
      cost: sanitizedCost,
      notes: sanitizedNotes
    });
  }

  revalidatePath('/');
  revalidatePath('/timeline');
  redirect('/');
}
