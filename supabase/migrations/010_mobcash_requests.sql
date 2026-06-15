-- ============================================================
-- MOBCASH REQUESTS
-- Table pour les demandes de dépôt/retrait MobCash sur 1xBet
-- Les utilisateurs soumettent leurs demandes via le site
-- et l'admin reçoit un email de notification automatique.
-- ============================================================

CREATE TABLE IF NOT EXISTS mobcash_requests (
  id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           TEXT    NOT NULL CHECK (type IN ('depot', 'retrait')),
  amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  bookmaker      TEXT    NOT NULL DEFAULT '1xbet',
  bookmaker_id   TEXT    NOT NULL,
  phone          TEXT    NOT NULL,
  full_name      TEXT    NOT NULL,
  email          TEXT,
  notes          TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_notes    TEXT,
  processed_by   UUID    REFERENCES auth.users(id),
  processed_at   TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches admin
CREATE INDEX IF NOT EXISTS idx_mobcash_status
  ON mobcash_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mobcash_bookmaker_id
  ON mobcash_requests (bookmaker_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_mobcash_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mobcash_updated_at
  BEFORE UPDATE ON mobcash_requests
  FOR EACH ROW EXECUTE FUNCTION update_mobcash_updated_at();

-- RLS : seul le service role (admin backend) peut accéder
ALTER TABLE mobcash_requests ENABLE ROW LEVEL SECURITY;
