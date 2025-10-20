'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../lib/device';
import { createVehicle, ensureDevice } from '../../lib/repository';

export async function submitVehicleAction(formData: FormData) {
  const deviceId = requireDeviceId('/onboarding');
  await ensureDevice(deviceId);

  const yearValue = formData.get('year');
  const makeValue = formData.get('make');
  const modelValue = formData.get('model');

  if (!makeValue || !modelValue) {
    throw new Error('Make and model are required.');
  }

  const year = typeof yearValue === 'string' && yearValue.trim().length > 0 ? Number(yearValue) : null;
  const make = String(makeValue).trim();
  const model = String(modelValue).trim();
  const vinValue = formData.get('vin');
  const mileageValue = formData.get('current_mileage');
  const emailValue = formData.get('contact_email');

  const currentMileage =
    typeof mileageValue === 'string' && mileageValue.trim().length > 0
      ? Number(mileageValue)
      : null;

  const contactEmailRaw =
    typeof emailValue === 'string' && emailValue.trim().length > 0
      ? emailValue.trim().toLowerCase()
      : null;

  if (
    contactEmailRaw &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmailRaw)
  ) {
    throw new Error('Please enter a valid email address for reminders.');
  }

  await createVehicle(deviceId, {
    year: Number.isFinite(year) ? year : null,
    make,
    model,
    vin: typeof vinValue === 'string' ? vinValue : null,
    contact_email: contactEmailRaw,
    current_mileage: Number.isFinite(currentMileage) ? currentMileage : null
  });

  revalidatePath('/');
  revalidatePath('/timeline');
  redirect('/');
}
