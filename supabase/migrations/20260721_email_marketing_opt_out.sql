-- ============================================================
-- Désabonnement marketing (conformité Gmail / délivrabilité)
--
-- Gmail exige depuis février 2024 que les emails de masse proposent un
-- désabonnement en un clic (List-Unsubscribe-Post). L'en-tête pointe vers
-- /api/email/unsubscribe, qui écrit ici. Les emails TRANSACTIONNELS (code OTP,
-- activation de compte, statut d'un dépôt) ne sont pas concernés : ils
-- continuent d'être envoyés même après désabonnement marketing.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_out BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_out_at TIMESTAMPTZ;

-- Les campagnes filtrent sur cette colonne à chaque envoi.
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_opt_out
  ON profiles (marketing_opt_out) WHERE marketing_opt_out = false;

-- Désabonnements d'adresses sans compte (imports, anciens contacts).
CREATE TABLE IF NOT EXISTS email_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_opt_outs_email
  ON email_opt_outs (lower(email));

ALTER TABLE email_opt_outs ENABLE ROW LEVEL SECURITY;
