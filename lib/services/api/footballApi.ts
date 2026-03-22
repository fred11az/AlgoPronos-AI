/**
 * Football API Service with Supabase Caching
 * Provider: API-Football v3 (api-football.com / v3.football.api-sports.io)
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = 'https://v3.football.api-sports.io';

/**
 * Robust fetcher with caching — API-Football v3
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
    if (!API_FOOTBALL_KEY) {
      console.warn('[api-cache] MISS, but missing API_FOOTBALL_KEY');
      return null;
    }

    console.log(`[api-cache] MISS (or EXPIRED): ${url.toString()}`);
    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_FOOTBALL_KEY,
      },
    });

    if (!res.ok) {
      console.error(`[api-cache] API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    // Force UTF-8 decoding regardless of Content-Type charset header
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const json = JSON.parse(text);

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
