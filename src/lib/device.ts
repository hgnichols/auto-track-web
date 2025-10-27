import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const DEVICE_COOKIE_NAME = 'autotrack_device_id';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(value: string | undefined | null) {
  if (!value) {
    return false;
  }

  return UUID_REGEX.test(value);
}

export async function getDeviceId() {
  const store = await cookies();
  const existing = await store.get(DEVICE_COOKIE_NAME);

  if (!existing?.value) {
    return null;
  }

  if (!isValidDeviceId(existing.value)) {
    return null;
  }

  return existing.value;
}

export async function requireDeviceId(returnPath: string) {
  const id = await getDeviceId();

  if (id) {
    return id;
  }

  const safePath = returnPath.startsWith('/') ? returnPath : '/';
  redirect(`/device/init?redirect=${encodeURIComponent(safePath)}`);
}
