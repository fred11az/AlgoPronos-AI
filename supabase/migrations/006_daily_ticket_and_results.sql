-- ========================================
-- ALGOPRONOS AI - DAILY TICKET + RESULTS
-- Ticket IA du Jour + historique des performances
-- ========================================

-- ─── Table: daily_ticket ─────────────────────────────────────────────────────
-- Un ticket IA partagé par jour, visible de tous
CREATE TABLE IF NOT EXISTS daily_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  matches JSONB NOT NULL DEFAULT '[]',
  total_odds DECIMAL(10, 2) NOT NULL DEFAULT 1.0,
  confidence_pct INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'balanced',
  analysis JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'won', 'lost', 'void')),
  result_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_ticket_date ON daily_ticket(date);
CREATE INDEX IF NOT EXISTS idx_daily_ticket_status ON daily_ticket(status);

-- RLS: lecture publique, écriture admin uniquement
ALTER TABLE daily_ticket ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily tickets"
  ON daily_ticket FOR SELECT
  USING (true);

-- ─── Colonne result sur combine_usage_log ────────────────────────────────────
-- Permet de tracker si le combiné d'un utilisateur a gagné ou perdu
ALTER TABLE combine_usage_log
  ADD COLUMN IF NOT EXISTS result TEXT
    CHECK (result IN ('won', 'lost', 'void')),
  ADD COLUMN IF NOT EXISTS result_notes TEXT,
  ADD COLUMN IF NOT EXISTS result_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_combine_usage_result ON combine_usage_log(result);

-- ─── Colonne status sur generated_combines ──────────────────────────────────
-- Statut global du combiné (partagé entre tous les utilisateurs du cache)
ALTER TABLE generated_combines
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'won', 'lost', 'void')),
  ADD COLUMN IF NOT EXISTS result_resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_generated_combines_status ON generated_combines(status);

-- ─── Vue: performance globale IA ────────────────────────────────────────────
CREATE OR REPLACE VIEW ai_performance_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'won')  AS total_won,
  COUNT(*) FILTER (WHERE status = 'lost') AS total_lost,
  COUNT(*) FILTER (WHERE status = 'void') AS total_void,
  COUNT(*) FILTER (WHERE status IN ('won', 'lost')) AS total_resolved,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'won')::DECIMAL
    / NULLIF(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0) * 100
  , 1) AS win_rate_pct,
  AVG(total_odds) FILTER (WHERE status IN ('won', 'lost')) AS avg_odds,
  MAX(total_odds) FILTER (WHERE status = 'won') AS best_win_odds,
  COUNT(*) AS total_tickets
FROM daily_ticket;
