'use client';

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!supabaseInstance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Return a mock during SSR/build time
        if (typeof window === 'undefined') {
          return () => Promise.resolve({ data: null, error: null });
        }
        throw new Error('Missing Supabase environment variables');
      }

      supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
    }

    return supabaseInstance[prop as keyof SupabaseClient];
  },
});
