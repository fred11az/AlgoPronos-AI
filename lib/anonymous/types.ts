/**
 * Types for Anonymous Session Management
 *
 * This module defines the types used for managing anonymous user sessions,
 * allowing users to access the dashboard without creating an account first.
 */

export interface AnonymousSession {
  id: string;
  anonymous_id: string;
  created_at: string;
  expires_at: string;
  metadata: AnonymousSessionMetadata;
  converted_to_user_id: string | null;
  converted_at: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  last_activity_at: string;
}

export interface AnonymousSessionMetadata {
  // Coupon preferences saved by anonymous user
  savedCouponPreferences?: {
    leagues?: string[];
    riskLevel?: 'safe' | 'balanced' | 'risky';
    betType?: 'single' | 'double' | 'triple' | 'accumulator';
  };
  // Temporary match selections (not persisted to generation)
  tempMatchSelections?: string[];
  // Source tracking for analytics
  source?: string;
  referrer?: string;
}

export interface AnonymousSessionEvent {
  id: string;
  anonymous_session_id: string;
  event_type: AnonymousEventType;
  event_data: Record<string, unknown>;
  created_at: string;
}

export type AnonymousEventType =
  | 'session_created'
  | 'dashboard_viewed'
  | 'coupon_config_started'
  | 'matches_selected'
  | 'generation_attempted'
  | 'activation_prompted'
  | 'account_created'
  | 'session_converted';

/**
 * User context that can represent either an authenticated user or anonymous session
 */
export interface UserContext {
  type: 'authenticated' | 'anonymous';
  // Authenticated user fields
  id?: string;
  email?: string;
  full_name?: string | null;
  tier?: 'verified' | null;
  daily_coupon_count?: number;
  last_coupon_date?: string | null;
  // Anonymous session fields
  anonymous_id?: string;
  anonymous_session?: AnonymousSession;
}

/**
 * Cookie configuration for anonymous sessions
 */
export const ANONYMOUS_COOKIE_CONFIG = {
  name: 'algopronos_anonymous_session',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const;
