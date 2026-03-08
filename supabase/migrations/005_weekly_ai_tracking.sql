-- ========================================
-- ALGOPRONOS AI - WEEKLY AI TRACKING
-- Freemium model: visitor(1/week) / registered(2/week) / verified(unlimited)
-- Switches from daily coupon limit to weekly AI analysis limit
-- ========================================

-- Add weekly AI tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_ai_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_ai_reset_at DATE;

-- Index for weekly reset lookups
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_ai_reset ON profiles(weekly_ai_reset_at);

-- Add helpful comments
COMMENT ON COLUMN profiles.weekly_ai_count IS 'Number of AI analyses used this week';
COMMENT ON COLUMN profiles.weekly_ai_reset_at IS 'Date of the Monday that started the current week window';
