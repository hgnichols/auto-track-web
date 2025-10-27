import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  DEVICE_COOKIE_MAX_AGE,
  DEVICE_COOKIE_NAME,
  isValidDeviceId
} from '../../../lib/device';

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirect') ?? '/';
  const redirectPath = redirectParam.startsWith('/') ? redirectParam : '/';
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  const existingDeviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value;

  if (!isValidDeviceId(existingDeviceId)) {
    response.cookies.set({
      name: DEVICE_COOKIE_NAME,
      value: randomUUID(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: DEVICE_COOKIE_MAX_AGE,
      path: '/'
    });
  }

  return response;
}
