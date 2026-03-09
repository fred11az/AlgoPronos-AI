-- Match Predictions table for programmatic SEO
-- Each row = one AI-generated prediction for an upcoming match

CREATE TABLE IF NOT EXISTS match_predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL,           -- "arsenal-vs-chelsea" (team-based, unique per matchup)
  home_team     TEXT NOT NULL,
  away_team     TEXT NOT NULL,
  home_team_slug TEXT NOT NULL,          -- slugified home team
  away_team_slug TEXT NOT NULL,          -- slugified away team
  league        TEXT NOT NULL,
  league_code   TEXT NOT NULL,
  league_slug   TEXT NOT NULL,           -- "premier-league"
  country       TEXT NOT NULL DEFAULT '',
  match_date    DATE NOT NULL,
  match_time    TEXT NOT NULL DEFAULT '15:00',
  -- Odds
  odds_home     NUMERIC(5,2),
  odds_draw     NUMERIC(5,2),
  odds_away     NUMERIC(5,2),
  -- AI Prediction
  prediction    TEXT,                    -- e.g. "Arsenal gagne"
  prediction_type TEXT,                  -- "home" | "draw" | "away" | "btts" | "over25"
  probability   INTEGER,                 -- model probability % (e.g. 63)
  implied_probability INTEGER,           -- bookmaker implied % (e.g. 54)
  value_edge    NUMERIC(4,1),            -- modelPct - impliedPct (e.g. +9.0)
  recommended_odds NUMERIC(5,2),        -- odds for the recommended bet
  ai_analysis   TEXT,                    -- full AI analysis paragraph
  -- Team form (last 5: W/D/L)
  home_form     TEXT,                    -- e.g. "WDWWL"
  away_form     TEXT,                    -- e.g. "LWDWW"
  -- Resolution
  is_resolved   BOOLEAN DEFAULT FALSE,
  result        TEXT,                    -- actual match result after game
  is_correct    BOOLEAN,                 -- whether prediction was correct
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,             -- prediction expires after the match
  UNIQUE(slug)
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_match_predictions_slug ON match_predictions(slug);
-- Index for league pages
CREATE INDEX IF NOT EXISTS idx_match_predictions_league_slug ON match_predictions(league_slug);
-- Index for team pages
CREATE INDEX IF NOT EXISTS idx_match_predictions_home_team_slug ON match_predictions(home_team_slug);
CREATE INDEX IF NOT EXISTS idx_match_predictions_away_team_slug ON match_predictions(away_team_slug);
-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_match_predictions_match_date ON match_predictions(match_date);
-- Index for unresolved upcoming matches
CREATE INDEX IF NOT EXISTS idx_match_predictions_upcoming ON match_predictions(match_date, is_resolved);

-- RLS: public read, service-role write
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read predictions"
  ON match_predictions FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert/update predictions"
  ON match_predictions FOR ALL
  USING (auth.role() = 'service_role');
