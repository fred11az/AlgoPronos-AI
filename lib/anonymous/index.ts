/**
 * Anonymous Session Management
 *
 * This module provides functionality for anonymous user sessions,
 * allowing users to access the dashboard and prepare coupons
 * without creating an account first.
 *
 * Key features:
 * - Secure cookie-based session identification
 * - Server-side session storage in Supabase
 * - Transparent migration to registered accounts
 * - Same verification blocking as unverified accounts
 */

// Export types
export * from './types';

// Export server-side functions (for use in API routes and Server Components)
export {
  getAnonymousSessionId,
  setAnonymousSessionCookie,
  clearAnonymousSessionCookie,
  getAnonymousSession,
  getCurrentAnonymousSession,
  createAnonymousSession,
  getOrCreateAnonymousSession,
  updateAnonymousSessionActivity,
  updateAnonymousSessionMetadata,
  convertAnonymousToUser,
  logAnonymousEvent,
  getUserContext,
  isAnonymousUser,
  isUnverifiedUser,
  canGenerateCoupons,
} from './server';
