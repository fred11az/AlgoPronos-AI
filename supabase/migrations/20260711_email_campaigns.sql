-- Migration: historique des campagnes email (admin)
-- Created: 2026-07-11
-- Chaque campagne réellement envoyée (hors aperçu/test) est sauvegardée ici
-- avant tout, ce qui permet de la consulter et de la RENVOYER depuis l'admin.
-- Accès UNIQUEMENT via service role (routes API admin) : RLS activé, aucune policy publique.

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  target TEXT NOT NULL CHECK (target IN ('all', 'selection')),
  recipient_ids UUID[],              -- NULL quand target = 'all'
  total INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  first_error TEXT,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON public.email_campaigns(created_at DESC);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
