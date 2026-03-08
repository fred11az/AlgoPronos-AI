import { NextResponse } from 'next/server';
import { ANONYMOUS_COOKIE_CONFIG } from '@/lib/anonymous/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/try-free
 * Sets an anonymous session cookie and redirects to the dashboard.
 * Bypasses DB session creation so it works without the anonymous_sessions table.
 */
export async function GET(request: Request) {
  const sessionId = uuidv4();

  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  response.cookies.set({
    name: ANONYMOUS_COOKIE_CONFIG.name,
    value: sessionId,
    maxAge: ANONYMOUS_COOKIE_CONFIG.maxAge,
    httpOnly: ANONYMOUS_COOKIE_CONFIG.httpOnly,
    secure: ANONYMOUS_COOKIE_CONFIG.secure,
    sameSite: ANONYMOUS_COOKIE_CONFIG.sameSite,
    path: ANONYMOUS_COOKIE_CONFIG.path,
  });

  return response;
}
