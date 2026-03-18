-- ========================================
-- ALGOPRONOS AI - SCALE & ADVANCED STRATEGIES
-- Multi-sport support + Montante + Optimus
-- ========================================

-- 1. Extend match_predictions for multi-sport and unique content
ALTER TABLE match_predictions 
  ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football',
  ADD COLUMN IF NOT EXISTS team_history_context JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_match_predictions_sport ON match_predictions(sport);

-- 2. Extend matches_cache for multi-sport
ALTER TABLE matches_cache 
  ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'football';

CREATE INDEX IF NOT EXISTS idx_matches_cache_sport ON matches_cache(sport);

-- 3. Extend daily_ticket for new strategies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_type') THEN
        CREATE TYPE ticket_type AS ENUM ('classic', 'montante', 'optimus');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_tier_type') THEN
        CREATE TYPE access_tier_type AS ENUM ('all', 'optimised_only');
    END IF;
END $$;

ALTER TABLE daily_ticket 
  ADD COLUMN IF NOT EXISTS type ticket_type DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS access_tier access_tier_type DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_amount DECIMAL(10, 2);

-- Drop old one-ticket-per-day constraint and add multi-type constraint
ALTER TABLE daily_ticket DROP CONSTRAINT IF EXISTS daily_ticket_date_key;
ALTER TABLE daily_ticket ADD CONSTRAINT daily_ticket_date_type_key UNIQUE (date, type);

CREATE INDEX IF NOT EXISTS idx_daily_ticket_type ON daily_ticket(type);

-- 4. Update existing records to 'football'
UPDATE match_predictions SET sport = 'football' WHERE sport IS NULL;
UPDATE matches_cache SET sport = 'football' WHERE sport IS NULL;
UPDATE daily_ticket SET type = 'classic' WHERE type IS NULL;
