import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const DEVICE_COOKIE_NAME = 'autotrack_device_id';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getDeviceId() {
  const store = cookies();
  const existing = store.get(DEVICE_COOKIE_NAME);

  if (existing?.value) {
    return existing.value;
  }

  return null;
}

export function requireDeviceId(returnPath: string) {
  const id = getDeviceId();

  if (id) {
    return id;
  }

  const safePath = returnPath.startsWith('/') ? returnPath : '/';
  redirect(`/device/init?redirect=${encodeURIComponent(safePath)}`);
}
