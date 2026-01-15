/**
 * Anonymous Session API Route
 *
 * Handles anonymous session creation and retrieval.
 * GET: Get current anonymous session status
 * POST: Create or refresh anonymous session
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  getCurrentAnonymousSession,
  getOrCreateAnonymousSession,
  updateAnonymousSessionMetadata,
  logAnonymousEvent,
} from '@/lib/anonymous';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * GET /api/anonymous/session
 * Returns the current session status (anonymous or authenticated)
 */
export async function GET() {
  try {
    // First check if user is authenticated
    const authenticatedUser = await getCurrentUser();

    if (authenticatedUser) {
      return NextResponse.json({
        type: 'authenticated',
        user: {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          full_name: authenticatedUser.full_name,
          tier: authenticatedUser.tier,
          isVerified: authenticatedUser.tier === 'verified',
        },
      });
    }

    // Check for anonymous session
    const anonymousSession = await getCurrentAnonymousSession();

    if (anonymousSession) {
      return NextResponse.json({
        type: 'anonymous',
        session: {
          anonymous_id: anonymousSession.anonymous_id,
          created_at: anonymousSession.created_at,
          expires_at: anonymousSession.expires_at,
          metadata: anonymousSession.metadata,
        },
      });
    }

    // No session found
    return NextResponse.json({
      type: 'none',
      message: 'No active session',
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anonymous/session
 * Creates or refreshes an anonymous session
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is already authenticated
    const authenticatedUser = await getCurrentUser();

    if (authenticatedUser) {
      return NextResponse.json({
        type: 'authenticated',
        message: 'User is already authenticated, no anonymous session needed',
        user: {
          id: authenticatedUser.id,
          tier: authenticatedUser.tier,
        },
      });
    }

    // Get request headers for session creation
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown';
    const userAgent = headersList.get('user-agent') || undefined;

    // Parse optional metadata from request body
    let metadata = {};
    try {
      const body = await request.json();
      metadata = body.metadata || {};
    } catch {
      // No body or invalid JSON, use empty metadata
    }

    // Create or get existing anonymous session
    const session = await getOrCreateAnonymousSession({
      ipAddress,
      userAgent,
      metadata,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create anonymous session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      type: 'anonymous',
      session: {
        anonymous_id: session.anonymous_id,
        created_at: session.created_at,
        expires_at: session.expires_at,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error('Error creating anonymous session:', error);
    return NextResponse.json(
      { error: 'Failed to create anonymous session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/anonymous/session
 * Updates anonymous session metadata
 */
export async function PATCH(request: NextRequest) {
  try {
    const anonymousSession = await getCurrentAnonymousSession();

    if (!anonymousSession) {
      return NextResponse.json(
        { error: 'No active anonymous session' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { metadata, event } = body;

    // Update metadata if provided
    if (metadata) {
      const success = await updateAnonymousSessionMetadata(
        anonymousSession.anonymous_id,
        metadata
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update session metadata' },
          { status: 500 }
        );
      }
    }

    // Log event if provided
    if (event && event.type) {
      await logAnonymousEvent(anonymousSession.id, event.type, event.data);
    }

    return NextResponse.json({
      success: true,
      anonymous_id: anonymousSession.anonymous_id,
    });
  } catch (error) {
    console.error('Error updating anonymous session:', error);
    return NextResponse.json(
      { error: 'Failed to update anonymous session' },
      { status: 500 }
    );
  }
}
