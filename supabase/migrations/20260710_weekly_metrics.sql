-- Migration: Weekly acquisition & conversion metrics (admin analytics)
-- Created: 2026-07-10
-- Une ligne par semaine, saisie manuelle par l'admin dans /admin/analytics/acquisition.
-- Accès UNIQUEMENT via service role (routes API admin) : RLS activé, aucune policy publique.

CREATE TABLE IF NOT EXISTS public.weekly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE UNIQUE NOT NULL,                              -- lundi de la semaine
  ad_budget_fcfa NUMERIC(14,2) NOT NULL DEFAULT 0,              -- budget publicitaire Facebook
  fb_signups INTEGER NOT NULL DEFAULT 0,                        -- inscrits via publicité Facebook
  field_signups INTEGER NOT NULL DEFAULT 0,                     -- inscrits via prospection terrain
  ambassador_salary_fcfa NUMERIC(14,2) NOT NULL DEFAULT 0,      -- salaires ambassadeurs terrain
  new_contacts INTEGER NOT NULL DEFAULT 0,                      -- nouveaux contacts
  total_signups INTEGER NOT NULL DEFAULT 0,                     -- inscriptions AlgoPronos (total)
  onexbet_accounts INTEGER NOT NULL DEFAULT 0,                  -- comptes 1xBet créés
  first_deposits INTEGER NOT NULL DEFAULT 0,                    -- premiers dépôts
  active_players INTEGER NOT NULL DEFAULT 0,                    -- joueurs actifs
  affiliate_revenue_fcfa NUMERIC(14,2) NOT NULL DEFAULT 0,      -- revenus d'affiliation
  notes TEXT,
  ai_summary TEXT,                                              -- résumé IA hebdomadaire (généré)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_metrics_week_start ON public.weekly_metrics(week_start DESC);

-- RLS sans policy = aucune lecture/écriture côté client (anon/authenticated).
-- Seul le service role (routes /api/admin/*) peut lire et écrire.
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;
