-- Add sport column to match_predictions (defaults to 'football')
ALTER TABLE match_predictions
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'football';

CREATE INDEX IF NOT EXISTS idx_match_predictions_sport ON match_predictions(sport);
