// Redis Cache Service — Upstash Redis
// Provides sub-millisecond caching for match analyses and combines.
// Falls back gracefully when UPSTASH_REDIS_REST_URL / TOKEN are not set.

import { Redis } from '@upstash/redis';

// ─── TTL constants (seconds) ──────────────────────────────────────────────────

export const CACHE_TTL = {
  MATCH_ANALYSIS: 12 * 60 * 60,  // 12h  — analysis is valid for the match day
  COMBINE:        48 * 60 * 60,  // 48h  — same TTL as Supabase generated_combines
  MATCH_DATA:     12 * 60 * 60,  // 12h  — raw fixture data
  DAILY:          24 * 60 * 60,  // 24h  — daily ticket
} as const;

// ─── Client singleton ─────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Warn once per cold start; non-fatal — callers get null and skip cache
    console.warn(
      '[redis-cache] UPSTASH_REDIS_REST_URL / _TOKEN not set. Redis caching disabled.'
    );
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Retrieve a cached value. Returns null on miss or Redis unavailable. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    // Upstash auto-deserialises JSON strings stored by cacheSet
    return await redis.get<T>(key);
  } catch (err) {
    console.error(`[redis-cache] GET "${key}" failed:`, err);
    return null;
  }
}

/** Store a value with a TTL (seconds). Returns true on success. */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    return true;
  } catch (err) {
    console.error(`[redis-cache] SET "${key}" failed:`, err);
    return false;
  }
}

/** Delete a key. Returns true on success. */
export async function cacheDel(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.error(`[redis-cache] DEL "${key}" failed:`, err);
    return false;
  }
}

/** Check if a key exists without fetching the value. */
export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const count = await redis.exists(key);
    return count === 1;
  } catch (err) {
    console.error(`[redis-cache] EXISTS "${key}" failed:`, err);
    return false;
  }
}

// ─── Key builders ─────────────────────────────────────────────────────────────

/** Cache key for a single-match analysis (matchId + riskLevel + day). */
export function buildAnalysisCacheKey(
  matchId: string,
  riskLevel: string,
  date: string,
): string {
  const day = date.split('T')[0]; // normalise ISO to YYYY-MM-DD
  return `algopronos:analysis:v1:${matchId}:${riskLevel}:${day}`;
}

/** Cache key for a generated combine (mirrors the Supabase cache_key). */
export function buildCombineCacheKey(cacheKey: string): string {
  return `algopronos:combine:v1:${cacheKey}`;
}
