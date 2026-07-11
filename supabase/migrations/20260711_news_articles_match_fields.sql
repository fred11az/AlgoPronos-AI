-- Migration: articles typés (résultat de match) + analyse IA + bucket images
-- Created: 2026-07-11
-- article_type: 'standard' | 'match_result' (score affiché sous le titre)
-- match_info:   { home_team, away_team, home_score, away_score, league, match_date }
-- ai_analysis:  encadré "Analyse IA AlgoPronos" affiché en fin d'article

ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (article_type IN ('standard', 'match_result')),
  ADD COLUMN IF NOT EXISTS match_info JSONB,
  ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

-- Bucket public pour les images de couverture des articles.
-- Écriture: service role uniquement (route API admin) ; lecture publique.
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-covers', 'news-covers', true)
ON CONFLICT (id) DO NOTHING;
