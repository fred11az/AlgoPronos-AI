-- ========================================
-- ALGOPRONOS AI - FREE MODEL UPDATE
-- 100% Gratuit avec vérification 1xBet
-- 2 coupons/jour par utilisateur vérifié
-- ========================================

-- Add daily coupon tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS daily_coupon_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_coupon_date DATE;

-- Create index for daily coupon lookups
CREATE INDEX IF NOT EXISTS idx_profiles_last_coupon_date ON profiles(last_coupon_date);

-- Update user_tier enum to only have 'verified'
-- First, update existing values
UPDATE profiles SET tier = 'verified' WHERE tier IN ('premium', 'vip_lifetime');

-- Note: Changing enum types in PostgreSQL is complex
-- For simplicity, we'll keep the old enum and just use 'verified' as the new value
-- The application code will only recognize 'verified' now

-- Update the activate_vip_after_approval function to set tier to 'verified'
CREATE OR REPLACE FUNCTION activate_vip_after_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE profiles
    SET tier = 'verified'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove premium activation function (no more paid subscriptions)
DROP TRIGGER IF EXISTS subscription_payment_completed ON subscriptions;
DROP FUNCTION IF EXISTS activate_premium_after_payment();

-- Add a function to reset daily coupon count at midnight
CREATE OR REPLACE FUNCTION reset_daily_coupon_if_new_day()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's a new day, reset the count
  IF OLD.last_coupon_date IS NULL OR OLD.last_coupon_date < CURRENT_DATE THEN
    NEW.daily_coupon_count := 1;
    NEW.last_coupon_date := CURRENT_DATE;
  ELSE
    NEW.daily_coupon_count := OLD.daily_coupon_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment out subscriptions and payment tables (keep for historical data)
-- They are no longer used but we keep the data

-- Add helpful comments
COMMENT ON COLUMN profiles.daily_coupon_count IS 'Number of coupons used today (max 2)';
COMMENT ON COLUMN profiles.last_coupon_date IS 'Last date a coupon was generated';
COMMENT ON COLUMN profiles.tier IS 'User verification status: verified = has 1xBet account with promo code';
