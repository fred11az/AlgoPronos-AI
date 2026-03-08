import { NextResponse } from 'next/server';
import { ANONYMOUS_COOKIE_CONFIG } from '@/lib/anonymous/types';
import { createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

/**
 * GET /api/try-free
 * Creates an anonymous session in DB + sets the cookie, then redirects to dashboard.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(ANONYMOUS_COOKIE_CONFIG.name)?.value;

  // Reuse existing valid session if any
  if (existingId) {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('anonymous_sessions')
      .select('anonymous_id')
      .eq('anonymous_id', existingId)
      .gt('expires_at', new Date().toISOString())
      .is('converted_to_user_id', null)
      .maybeSingle();

    if (data) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Create new anonymous session in DB
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + ANONYMOUS_COOKIE_CONFIG.maxAge * 1000).toISOString();

  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.from('anonymous_sessions').insert({
      anonymous_id: sessionId,
      metadata: {},
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error('Failed to create anonymous session in DB:', err);
    // Continue anyway — cookie-only fallback
  }

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
