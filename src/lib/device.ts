import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerSupabaseClient } from './supabase/clients';

export async function getDeviceId(client?: SupabaseClient) {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function requireDeviceId(returnPath: string, client?: SupabaseClient) {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  const safePath = returnPath.startsWith('/') ? returnPath : '/';
  redirect(`/login?redirect=${encodeURIComponent(safePath)}`);
}
