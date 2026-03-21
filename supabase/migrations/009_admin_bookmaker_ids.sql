-- ========================================
-- ADMIN APPROVED BOOKMAKER IDs
-- Table pour que les admins puissent
-- enregistrer des IDs bookmakers directement,
-- sans attendre une demande de l'utilisateur.
-- Quand un ID est ici, /api/verify-account
-- renvoie { optimized: true } → "Félicitations !"
-- ========================================

CREATE TABLE IF NOT EXISTS admin_approved_bookmaker_ids (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmaker   TEXT    NOT NULL,          -- ex: '1xbet', 'melbet'
  account_id  TEXT    NOT NULL,          -- ID bookmaker de l'utilisateur
  notes       TEXT,                      -- note admin optionnelle
  added_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Évite les doublons d'ID (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_bm_ids_unique
  ON admin_approved_bookmaker_ids (lower(account_id));

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_admin_bm_ids_bookmaker
  ON admin_approved_bookmaker_ids (bookmaker);

-- RLS : seul le service role (admin backend) peut lire/écrire
ALTER TABLE admin_approved_bookmaker_ids ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne peuvent pas accéder à cette table directement
-- (toutes les opérations passent par les API routes server-side avec service role)
