import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.');
  }

  return url;
}

function getSupabaseAnonKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
  }

  return anonKey;
}

export function createBrowserSupabaseClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      }
    }
  });
}
