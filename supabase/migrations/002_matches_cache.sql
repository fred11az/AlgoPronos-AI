-- Table pour cacher les matchs récupérés par Claude
CREATE TABLE IF NOT EXISTS matches_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  leagues TEXT[] NOT NULL,
  matches JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index unique sur date + leagues pour éviter les doublons
  CONSTRAINT unique_date_leagues UNIQUE (date, leagues)
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_matches_cache_date ON matches_cache(date);
CREATE INDEX IF NOT EXISTS idx_matches_cache_expires ON matches_cache(expires_at);

-- Fonction pour nettoyer les anciennes entrées
CREATE OR REPLACE FUNCTION cleanup_expired_matches_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM matches_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
