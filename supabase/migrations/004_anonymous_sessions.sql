-- Migration: Anonymous Sessions Support
-- Description: Adds support for anonymous user sessions to allow dashboard access
-- without initial account creation while preserving the existing verification flow

-- Create anonymous_sessions table
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}'::jsonb,
  converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_anonymous_id ON anonymous_sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_expires_at ON anonymous_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_converted_to_user_id ON anonymous_sessions(converted_to_user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_last_activity ON anonymous_sessions(last_activity_at);

-- Enable RLS on anonymous_sessions
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anonymous sessions to be read via service role only
-- (Anonymous sessions are managed by the server, not directly by clients)
CREATE POLICY "Service role can manage anonymous sessions"
  ON anonymous_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update last_activity_at timestamp
CREATE OR REPLACE FUNCTION update_anonymous_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity_at on updates
CREATE TRIGGER trigger_update_anonymous_activity
  BEFORE UPDATE ON anonymous_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_session_activity();

-- Function to clean up expired anonymous sessions (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM anonymous_sessions
  WHERE expires_at < NOW()
  AND converted_to_user_id IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Table to track anonymous session activity for analytics (optional)
CREATE TABLE IF NOT EXISTS anonymous_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id UUID REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_events_session ON anonymous_session_events(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_events_type ON anonymous_session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_anonymous_events_created ON anonymous_session_events(created_at);

-- Enable RLS on events table
ALTER TABLE anonymous_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage anonymous events"
  ON anonymous_session_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE anonymous_sessions IS 'Stores anonymous user sessions for dashboard access without account creation';
COMMENT ON COLUMN anonymous_sessions.anonymous_id IS 'Unique identifier stored in secure cookie for session identification';
COMMENT ON COLUMN anonymous_sessions.converted_to_user_id IS 'Links to user account when anonymous session is converted to registered user';
COMMENT ON COLUMN anonymous_sessions.metadata IS 'Stores anonymous user preferences and temporary coupon selections';
