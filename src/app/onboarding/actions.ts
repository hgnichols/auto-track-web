'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../lib/device';
import { createVehicle, ensureDevice, getVehicleCatalogEntry } from '../../lib/repository';

export async function submitVehicleAction(formData: FormData) {
  const deviceId = await requireDeviceId('/onboarding');
  await ensureDevice(deviceId);

  const yearValue = formData.get('year');
  const makeValue = formData.get('make');
  const modelValue = formData.get('model');

  if (!yearValue || !makeValue || !modelValue) {
    throw new Error('Please select a year, make, and model.');
  }

  const parsedYear =
    typeof yearValue === 'string' && yearValue.trim().length > 0 ? Number.parseInt(yearValue, 10) : NaN;

  if (!Number.isFinite(parsedYear)) {
    throw new Error('Please select a valid model year.');
  }

  const catalogEntry = await getVehicleCatalogEntry(parsedYear, String(makeValue), String(modelValue));

  if (!catalogEntry) {
    throw new Error('That year, make, and model combination was not found. Please try again.');
  }

  const year = catalogEntry.year;
  const make = catalogEntry.make_display;
  const model = catalogEntry.model_display;
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
