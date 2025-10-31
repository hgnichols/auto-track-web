import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createServerSupabaseClient } from './supabase/clients';

export async function getDeviceId(client?: SupabaseClient) {
  const user = await getUser(client);
  return user?.id ?? null;
}

export async function requireUser(returnPath: string, client?: SupabaseClient): Promise<User> {
  const user = await getUser(client);

  if (user) {
    return user;
  }

  const safePath = returnPath.startsWith('/') ? returnPath : '/';
  redirect(`/login?redirect=${encodeURIComponent(safePath)}`);
}

export async function requireDeviceId(returnPath: string, client?: SupabaseClient) {
  const user = await requireUser(returnPath, client);
  return user.id;
}

export async function getUser(client?: SupabaseClient) {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user ?? null;
}
