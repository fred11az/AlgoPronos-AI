/**
 * Anonymous Session Server-Side Management
 *
 * This module handles anonymous session creation, retrieval, and conversion
 * to registered user accounts on the server side.
 */

import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase/server';
import {
  AnonymousSession,
  AnonymousSessionMetadata,
  AnonymousEventType,
  ANONYMOUS_COOKIE_CONFIG,
  UserContext,
} from './types';

/**
 * Hash an IP address for privacy-preserving storage
 */
function hashIp(ip: string): string {
  return createHash('sha256').update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY).digest('hex').substring(0, 32);
}

/**
 * Get the anonymous session ID from cookies
 */
export async function getAnonymousSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANONYMOUS_COOKIE_CONFIG.name)?.value || null;
}

/**
 * Set the anonymous session cookie
 */
export async function setAnonymousSessionCookie(anonymousId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ANONYMOUS_COOKIE_CONFIG.name,
    value: anonymousId,
    httpOnly: ANONYMOUS_COOKIE_CONFIG.httpOnly,
    secure: ANONYMOUS_COOKIE_CONFIG.secure,
    sameSite: ANONYMOUS_COOKIE_CONFIG.sameSite,
    path: ANONYMOUS_COOKIE_CONFIG.path,
    maxAge: ANONYMOUS_COOKIE_CONFIG.maxAge,
  });
}

/**
 * Clear the anonymous session cookie
 */
export async function clearAnonymousSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ANONYMOUS_COOKIE_CONFIG.name);
}

/**
 * Get an existing anonymous session by its ID
 */
export async function getAnonymousSession(anonymousId: string): Promise<AnonymousSession | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('anonymous_sessions')
      .select('*')
      .eq('anonymous_id', anonymousId)
      .gt('expires_at', new Date().toISOString())
      .is('converted_to_user_id', null)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AnonymousSession;
  } catch (error) {
    console.error('Error getting anonymous session:', error);
    return null;
  }
}

/**
 * Get the current anonymous session from cookies
 */
export async function getCurrentAnonymousSession(): Promise<AnonymousSession | null> {
  const anonymousId = await getAnonymousSessionId();
  if (!anonymousId) {
    return null;
  }
  return getAnonymousSession(anonymousId);
}

/**
 * Create a new anonymous session
 */
export async function createAnonymousSession(
  options?: {
    ipAddress?: string;
    userAgent?: string;
    metadata?: Partial<AnonymousSessionMetadata>;
  }
): Promise<AnonymousSession | null> {
  try {
    const supabase = createAdminClient();
    const anonymousId = uuidv4();

    const sessionData = {
      anonymous_id: anonymousId,
      ip_hash: options?.ipAddress ? hashIp(options.ipAddress) : null,
      user_agent: options?.userAgent?.substring(0, 500) || null,
      metadata: options?.metadata || {},
      expires_at: new Date(Date.now() + ANONYMOUS_COOKIE_CONFIG.maxAge * 1000).toISOString(),
    };

    const { data, error } = await supabase
      .from('anonymous_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating anonymous session:', error);
      return null;
    }

    // Set the cookie
    await setAnonymousSessionCookie(anonymousId);

    // Log the session creation event
    await logAnonymousEvent(data.id, 'session_created', {
      source: options?.metadata?.source,
      referrer: options?.metadata?.referrer,
    });

    return data as AnonymousSession;
  } catch (error) {
    console.error('Error creating anonymous session:', error);
    return null;
  }
}

/**
 * Get or create an anonymous session
 * This is the main function to use for getting/initializing anonymous access
 */
export async function getOrCreateAnonymousSession(
  options?: {
    ipAddress?: string;
    userAgent?: string;
    metadata?: Partial<AnonymousSessionMetadata>;
  }
): Promise<AnonymousSession | null> {
  // First, try to get existing session from cookie
  const existingSession = await getCurrentAnonymousSession();
  if (existingSession) {
    // Update last activity
    await updateAnonymousSessionActivity(existingSession.id);
    return existingSession;
  }

  // Create new session
  return createAnonymousSession(options);
}

/**
 * Update an anonymous session's last activity timestamp
 */
export async function updateAnonymousSessionActivity(sessionId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('anonymous_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating anonymous session activity:', error);
  }
}

/**
 * Update anonymous session metadata
 */
export async function updateAnonymousSessionMetadata(
  anonymousId: string,
  metadata: Partial<AnonymousSessionMetadata>
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('anonymous_sessions')
      .select('metadata')
      .eq('anonymous_id', anonymousId)
      .single();

    const mergedMetadata = {
      ...(existing?.metadata || {}),
      ...metadata,
    };

    const { error } = await supabase
      .from('anonymous_sessions')
      .update({ metadata: mergedMetadata })
      .eq('anonymous_id', anonymousId);

    return !error;
  } catch (error) {
    console.error('Error updating anonymous session metadata:', error);
    return false;
  }
}

/**
 * Convert an anonymous session to a registered user account
 * Called after user successfully creates an account
 */
export async function convertAnonymousToUser(
  anonymousId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    // Update the anonymous session with the user reference
    const { error } = await supabase
      .from('anonymous_sessions')
      .update({
        converted_to_user_id: userId,
        converted_at: new Date().toISOString(),
      })
      .eq('anonymous_id', anonymousId);

    if (error) {
      console.error('Error converting anonymous session:', error);
      return false;
    }

    // Get the session to log the event
    const { data: session } = await supabase
      .from('anonymous_sessions')
      .select('id, metadata')
      .eq('anonymous_id', anonymousId)
      .single();

    if (session) {
      await logAnonymousEvent(session.id, 'session_converted', { userId });

      // Optionally: Transfer metadata to user profile if needed
      // This could include saved preferences, etc.
    }

    // Clear the anonymous cookie since user is now authenticated
    await clearAnonymousSessionCookie();

    return true;
  } catch (error) {
    console.error('Error converting anonymous session:', error);
    return false;
  }
}

/**
 * Log an event for an anonymous session
 */
export async function logAnonymousEvent(
  sessionId: string,
  eventType: AnonymousEventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('anonymous_session_events').insert({
      anonymous_session_id: sessionId,
      event_type: eventType,
      event_data: eventData || {},
    });
  } catch (error) {
    console.error('Error logging anonymous event:', error);
  }
}

/**
 * Get user context - returns either authenticated user or anonymous session info
 * This is the main function to use in pages/components to get the current user context
 */
export async function getUserContext(): Promise<UserContext | null> {
  // First, try to get authenticated user
  const { getCurrentUser } = await import('@/lib/supabase/server');
  const authenticatedUser = await getCurrentUser();

  if (authenticatedUser) {
    return {
      type: 'authenticated',
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      full_name: authenticatedUser.full_name,
      tier: authenticatedUser.tier,
      daily_coupon_count: authenticatedUser.daily_coupon_count,
      last_coupon_date: authenticatedUser.last_coupon_date,
    };
  }

  // If no authenticated user, check for anonymous session
  const anonymousSession = await getCurrentAnonymousSession();

  if (anonymousSession) {
    return {
      type: 'anonymous',
      anonymous_id: anonymousSession.anonymous_id,
      anonymous_session: anonymousSession,
    };
  }

  return null;
}

/**
 * Check if the current user context is anonymous
 */
export async function isAnonymousUser(): Promise<boolean> {
  const context = await getUserContext();
  return context?.type === 'anonymous';
}

/**
 * Check if the current user context is an authenticated but unverified user
 */
export async function isUnverifiedUser(): Promise<boolean> {
  const context = await getUserContext();
  return context?.type === 'authenticated' && context.tier !== 'verified';
}

/**
 * Check if the current user can attempt coupon generation.
 * Visitors (anonymous) and registered users can generate with weekly limits.
 * Verified users generate without limits.
 * Returns false only when there is no session at all.
 */
export async function canGenerateCoupons(): Promise<boolean> {
  const context = await getUserContext();
  return context !== null;
}

/**
 * Returns the generation tier for quota/prompt decisions.
 * 'verified'   → unlimited, optimized prompt (Groq 70b)
 * 'registered' → 2/week, free prompt (Groq 8b)
 * 'visitor'    → 1/week, free prompt (Groq 8b)
 * null         → no session, cannot generate
 */
export async function getGenerationTier(): Promise<'verified' | 'registered' | 'visitor' | null> {
  const context = await getUserContext();
  if (!context) return null;
  if (context.type === 'authenticated') {
    return context.tier === 'verified' ? 'verified' : 'registered';
  }
  return 'visitor';
}
