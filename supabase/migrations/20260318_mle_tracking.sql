-- Migration: MLE Training & Performance Tracking
-- Created: 2026-03-18

-- 1. Table for Dixon-Coles Model Parameters
CREATE TABLE IF NOT EXISTS public.model_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id TEXT NOT NULL, -- match against API-Football team name or ID
    league_id TEXT NOT NULL,
    attack NUMERIC NOT NULL DEFAULT 1.0,
    defense NUMERIC NOT NULL DEFAULT 1.0,
    season INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, league_id, season)
);

-- Enable RLS
ALTER TABLE public.model_params ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read model_params" ON public.model_params FOR SELECT USING (true);
CREATE POLICY "Master write model_params" ON public.model_params FOR ALL USING (true); -- Requires service role

-- 2. Table for Prediction Logs (ROI Dashboard)
CREATE TABLE IF NOT EXISTS public.predictions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    market TEXT NOT NULL, -- 'home', 'draw', 'away'
    model_prob NUMERIC NOT NULL,
    bookmaker_odds NUMERIC NOT NULL,
    value_edge NUMERIC NOT NULL,
    result TEXT DEFAULT 'PENDING', -- 'WIN', 'LOSS', 'PENDING'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(match_id, market)
);

-- Enable RLS
ALTER TABLE public.predictions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read predictions_log" ON public.predictions_log FOR SELECT USING (true);
CREATE POLICY "Master write predictions_log" ON public.predictions_log FOR ALL USING (true);
