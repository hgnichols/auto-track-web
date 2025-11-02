'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireUser } from '../../lib/device';
import { createVehicle, ensureDevice, getVehicleCatalogEntry } from '../../lib/repository';
import {
  ACTIVE_VEHICLE_COOKIE_MAX_AGE,
  ACTIVE_VEHICLE_COOKIE_NAME
} from '../../lib/vehicle-selection';
import { isEmailConfirmed } from '../../lib/user';

export async function submitVehicleAction(formData: FormData) {
  const user = await requireUser('/onboarding');
  const deviceId = user.id;
  await ensureDevice(deviceId);
  const returnToValue = formData.get('return_to');
  const returnPath =
    typeof returnToValue === 'string' && returnToValue.startsWith('/') ? returnToValue : '/';

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

  const currentMileage =
    typeof mileageValue === 'string' && mileageValue.trim().length > 0
      ? Number(mileageValue)
      : null;

  const contactEmailRaw =
    typeof user.email === 'string' && user.email.trim().length > 0
      ? user.email.trim().toLowerCase()
      : null;

  if (!contactEmailRaw) {
    throw new Error(
      'Your account does not have an email address. Update your Supabase profile email and try again.'
    );
  }

  if (!isEmailConfirmed(user)) {
    throw new Error(
      'Please confirm your email address before adding vehicles. Check your inbox for the verification link.'
    );
  }

  const vehicle = await createVehicle(deviceId, {
    year: Number.isFinite(year) ? year : null,
    make,
    model,
    vin: typeof vinValue === 'string' ? vinValue : null,
    contact_email: contactEmailRaw,
    current_mileage: Number.isFinite(currentMileage) ? currentMileage : null
  });

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

  revalidatePath('/');
  revalidatePath('/timeline');
  revalidatePath('/service/new');
  revalidatePath('/vehicle/mileage');
  if (returnPath !== '/' && returnPath !== '/timeline' && returnPath !== '/service/new' && returnPath !== '/vehicle/mileage') {
    revalidatePath(returnPath);
  }
  redirect(returnPath);
}
