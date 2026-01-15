'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Session type returned by the API
 */
export type SessionType = 'authenticated' | 'anonymous' | 'none';

/**
 * Authenticated user data
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string | null;
  tier: 'verified' | null;
  isVerified: boolean;
}

/**
 * Anonymous session data
 */
export interface AnonymousSessionData {
  anonymous_id: string;
  created_at: string;
  expires_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Session state returned by the hook
 */
export interface SessionState {
  type: SessionType;
  isLoading: boolean;
  error: string | null;
  // Authenticated user (only present if type === 'authenticated')
  user?: AuthenticatedUser;
  // Anonymous session (only present if type === 'anonymous')
  anonymousSession?: AnonymousSessionData;
}

/**
 * Hook for managing user sessions (both authenticated and anonymous)
 *
 * Usage:
 * ```tsx
 * const { type, isLoading, user, anonymousSession } = useSession();
 *
 * if (isLoading) return <Loading />;
 * if (type === 'authenticated') return <UserDashboard user={user} />;
 * if (type === 'anonymous') return <AnonymousDashboard />;
 * return <LoginPrompt />;
 * ```
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({
    type: 'none',
    isLoading: true,
    error: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/anonymous/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();

      if (data.type === 'authenticated') {
        setState({
          type: 'authenticated',
          isLoading: false,
          error: null,
          user: data.user,
        });
      } else if (data.type === 'anonymous') {
        setState({
          type: 'anonymous',
          isLoading: false,
          error: null,
          anonymousSession: data.session,
        });
      } else {
        setState({
          type: 'none',
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setState({
        type: 'none',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    ...state,
    refetch: fetchSession,
  };
}

/**
 * Hook for creating/initializing an anonymous session
 *
 * Usage:
 * ```tsx
 * const { createSession, isCreating } = useCreateAnonymousSession();
 *
 * const handleTryFree = async () => {
 *   const session = await createSession();
 *   if (session) {
 *     router.push('/dashboard');
 *   }
 * };
 * ```
 */
export function useCreateAnonymousSession() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (metadata?: Record<string, unknown>) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/anonymous/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to create anonymous session');
      }

      const data = await response.json();
      return data.session as AnonymousSessionData | null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createSession,
    isCreating,
    error,
  };
}

/**
 * Hook for checking if the current user can generate coupons
 *
 * Returns true only if user is authenticated AND verified
 */
export function useCanGenerate() {
  const { type, user, isLoading } = useSession();

  return {
    canGenerate: type === 'authenticated' && user?.isVerified === true,
    isLoading,
    reason: isLoading
      ? 'loading'
      : type === 'none'
      ? 'not_logged_in'
      : type === 'anonymous'
      ? 'anonymous'
      : !user?.isVerified
      ? 'not_verified'
      : 'can_generate',
  };
}
