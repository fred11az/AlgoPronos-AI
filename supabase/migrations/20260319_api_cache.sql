-- Migration: API Cache Table
-- Created: 2026-03-19

CREATE TABLE IF NOT EXISTS public.api_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read api_cache" ON public.api_cache FOR SELECT USING (true);
CREATE POLICY "Master write api_cache" ON public.api_cache FOR ALL USING (true); -- Requires service role
