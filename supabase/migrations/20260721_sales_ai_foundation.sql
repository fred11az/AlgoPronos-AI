-- ============================================================
-- SALES AI — Socle Sprint 1 (webhook Messenger + prospects)
-- Réf: docs/specs-v2/10-CAHIER-CHARGES-SALES-AI.md (Parties 4-5)
-- Tables backend-only (service role) : aucune policy publique.
-- ============================================================

-- ─── Prospects (un par utilisateur Messenger, clé = PSID Facebook) ───────────
CREATE TABLE IF NOT EXISTS sales_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité Messenger
  facebook_psid TEXT NOT NULL UNIQUE,
  facebook_name TEXT,

  -- Rattachement au profil AlgoPronos existant (Mission 4: éviter les doublons)
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- État du tunnel (13 états, cahier des charges Partie 4)
  state TEXT NOT NULL DEFAULT 'NEW' CHECK (state IN (
    'NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED',
    'ACCOUNT_CREATED', 'BOOKMAKER_PENDING', 'BOOKMAKER_CREATED',
    'ID_SUBMITTED', 'VERIFIED', 'FULL_ACCESS',
    'ACTIVE', 'LOYAL', 'PARTNER', 'INACTIVE'
  )),

  -- Mémoire commerciale (profil, financier, expertise, psychologie, actions)
  -- Structure JSON libre, cf. exemple Partie 5.3 du cahier des charges
  memory JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Vérification bookmaker (Mission 7)
  bookmaker TEXT,
  bookmaker_account_id TEXT,

  messages_count INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_prospects_state ON sales_prospects(state);
CREATE INDEX IF NOT EXISTS idx_sales_prospects_last_interaction ON sales_prospects(last_interaction_at);

-- ─── Journal de conversation (chaque message entrant/sortant) ────────────────
CREATE TABLE IF NOT EXISTS sales_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES sales_prospects(id) ON DELETE CASCADE,

  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text TEXT NOT NULL,

  -- Contexte au moment du message (état du tunnel, méta Claude…)
  state_at_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_conversations_prospect
  ON sales_conversations(prospect_id, created_at);

-- ─── Relances planifiées (Sprint 5+, table prête dès maintenant) ─────────────
CREATE TABLE IF NOT EXISTS sales_relances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES sales_prospects(id) ON DELETE CASCADE,

  relance_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_relances_due
  ON sales_relances(scheduled_at) WHERE sent_at IS NULL;

-- ─── Sécurité : accès service role uniquement ────────────────────────────────
ALTER TABLE sales_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_relances ENABLE ROW LEVEL SECURITY;

-- ─── updated_at automatique ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_sales_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_prospects_updated_at ON sales_prospects;
CREATE TRIGGER trg_sales_prospects_updated_at
  BEFORE UPDATE ON sales_prospects
  FOR EACH ROW EXECUTE FUNCTION update_sales_prospects_updated_at();
