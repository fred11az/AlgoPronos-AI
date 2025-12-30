-- ========================================
-- ALGOPRONOS AI - DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USER TIER ENUM
-- ========================================
CREATE TYPE user_tier AS ENUM ('premium', 'vip_lifetime');

-- ========================================
-- PROFILES TABLE
-- ========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'BJ',
  tier user_tier,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- VIP VERIFICATIONS TABLE
-- ========================================
CREATE TABLE vip_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  bookmaker_identifier TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vip_verifications_user_id ON vip_verifications(user_id);
CREATE INDEX idx_vip_verifications_status ON vip_verifications(status);

-- RLS Policies
ALTER TABLE vip_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON vip_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verifications" ON vip_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- SUBSCRIPTIONS TABLE
-- ========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan TEXT NOT NULL DEFAULT 'premium_weekly',
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  payment_method TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX idx_subscriptions_payment_status ON subscriptions(payment_status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- PAYMENT TRANSACTIONS TABLE
-- ========================================
CREATE TABLE payment_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  provider TEXT DEFAULT 'fedapay',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- GENERATED COMBINES TABLE
-- ========================================
CREATE TABLE generated_combines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  parameters JSONB NOT NULL,
  matches JSONB NOT NULL,
  total_odds DECIMAL(10,2) NOT NULL,
  estimated_probability INTEGER,
  analysis JSONB NOT NULL,
  usage_count INTEGER DEFAULT 1,
  first_generated_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_combines_cache_key ON generated_combines(cache_key);
CREATE INDEX idx_generated_combines_expires_at ON generated_combines(expires_at);

-- ========================================
-- COMBINE USAGE LOG TABLE
-- ========================================
CREATE TABLE combine_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  combine_id UUID REFERENCES generated_combines(id) NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('generated', 'from_cache')),
  user_tier user_tier NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_combine_usage_log_user_id ON combine_usage_log(user_id);
CREATE INDEX idx_combine_usage_log_created_at ON combine_usage_log(created_at);

-- ========================================
-- ADMIN SETTINGS TABLE
-- ========================================
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default promo code
INSERT INTO admin_settings (key, value) VALUES ('promo_code_1xbet', 'ALGOPRONO2025');

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function: Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_verifications_updated_at
  BEFORE UPDATE ON vip_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Activate VIP after approval
CREATE OR REPLACE FUNCTION activate_vip_after_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE profiles
    SET tier = 'vip_lifetime'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vip_verification_approved
  AFTER UPDATE ON vip_verifications
  FOR EACH ROW EXECUTE FUNCTION activate_vip_after_approval();

-- Function: Activate Premium after payment
CREATE OR REPLACE FUNCTION activate_premium_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE profiles
    SET tier = 'premium'
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_payment_completed
  AFTER UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION activate_premium_after_payment();

-- Function: Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STORAGE BUCKETS
-- ========================================

-- Create bucket for VIP verification screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('vip-verifications', 'vip-verifications', false)
ON CONFLICT DO NOTHING;

-- RLS for storage
CREATE POLICY "Users can upload verification screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vip-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own verification screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vip-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);
