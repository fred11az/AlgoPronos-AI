/**
 * Football API Service with Supabase Caching
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com';
const API_BASE = `https://${RAPIDAPI_HOST}`;

/**
 * Robust fetcher with caching
 */
export async function cachedFetch<T>(endpoint: string, params: Record<string, string> = {}, ttlSeconds: number = 3600): Promise<T | null> {
  const url = new URL(`${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  const cacheKey = url.toString();

  try {
    const supabase = getSupabase();
    // 1. Check Supabase cache
    const { data: cacheEntry, error: cacheError } = await supabase
      .from('api_cache')
      .select('data, fetched_at')
      .eq('cache_key', cacheKey)
      .single();

    if (cacheEntry && !cacheError) {
      const fetchedAt = new Date(cacheEntry.fetched_at).getTime();
      const age = (Date.now() - fetchedAt) / 1000;
      
      if (age < ttlSeconds) {
        console.log(`[api-cache] HIT: ${endpoint}`);
        return cacheEntry.data as T;
      }
    }

    // 2. Fallback to API call
    if (!RAPIDAPI_KEY) {
      console.warn('[api-cache] MISS, but missing RAPIDAPI_KEY');
      return null;
    }

    console.log(`[api-cache] MISS (or EXPIRED): ${url.toString()}`);
    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!res.ok) {
      console.error(`[api-cache] API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    
    // 3. Save to cache
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: json,
      fetched_at: new Date().toISOString()
    });

    return json as T;
  } catch (err) {
    console.error(`[api-cache] Error during cachedFetch for ${endpoint}:`, err);
    return null;
  }
}
