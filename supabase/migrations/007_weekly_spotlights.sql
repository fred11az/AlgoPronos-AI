-- ================================================================
-- WEEKLY SPOTLIGHTS — Grandes affiches de la semaine
-- Générée automatiquement chaque dimanche à 20h00 UTC
-- ================================================================

CREATE TABLE IF NOT EXISTS weekly_spotlights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,              -- "grandes-affiches-2026-03-09"
  week_start    DATE NOT NULL,                     -- Lundi de la semaine
  week_end      DATE NOT NULL,                     -- Dimanche de la semaine
  title         TEXT NOT NULL,                     -- "Grandes Affiches — 10-16 Mars 2026"
  hero_match    TEXT,                              -- "Real Madrid vs Manchester City"
  featured_league TEXT,                            -- "Champions League"
  summary       TEXT NOT NULL,                     -- Intro éditoriale IA (~2 paragraphes)
  key_matches   JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{slug, home, away, league, date, time, prediction, analysis}]
  all_match_slugs JSONB DEFAULT '[]'::jsonb,       -- Tous les slugs de la semaine (pour liaisons)
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_spotlights_week_start ON weekly_spotlights(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_spotlights_slug ON weekly_spotlights(slug);

ALTER TABLE weekly_spotlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read weekly spotlights"
  ON weekly_spotlights FOR SELECT
  USING (true);

CREATE POLICY "Service role can write weekly spotlights"
  ON weekly_spotlights FOR ALL
  USING (auth.role() = 'service_role');
