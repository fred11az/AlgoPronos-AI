import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ANONYMOUS_COOKIE_CONFIG } from '@/lib/anonymous/types';

/**
 * Check if request has a valid anonymous session cookie
 * Note: This only checks for the cookie presence, not validity
 * Full validation happens in the API routes/pages
 */
function hasAnonymousSessionCookie(request: NextRequest): boolean {
  const anonymousCookie = request.cookies.get(ANONYMOUS_COOKIE_CONFIG.name);
  return !!anonymousCookie?.value;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip auth check if Supabase is not configured
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  // Allow access if user is authenticated (and confirmed) OR has an anonymous session
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const hasAnonymousSession = hasAnonymousSessionCookie(request);

    // No authenticated user AND no anonymous session
    if (!user && !hasAnonymousSession) {
      return NextResponse.redirect(new URL('/try-free', request.url));
    }

    // Authenticated but NOT confirmed (and not on an anonymous session)
    if (user && !user.email_confirmed_at && !hasAnonymousSession) {
      // Redirect to verify-email with their email as a param
      const url = new URL('/verify-email', request.url);
      url.searchParams.set('email', user.email || '');
      return NextResponse.redirect(url);
    }
    // If user is authenticated & confirmed OR has anonymous session, allow access
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check admin status
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
    
    // Primary check: email from auth session (v1)
    let isAdmin: boolean = !!(user.email && adminEmails.includes(user.email.toLowerCase()));

    // Fallback: check profile only if session email is missing or not admin
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      
      isAdmin = !!(profile?.email && adminEmails.includes(profile.email.toLowerCase()));
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users from auth pages (except verify-email and auth callbacks)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/onboarding');
  const isAuthFlow = request.nextUrl.pathname.startsWith('/verify-email') ||
                     request.nextUrl.pathname.startsWith('/reset-password') ||
                     request.nextUrl.pathname.startsWith('/auth/callback') ||
                     request.nextUrl.pathname.startsWith('/auth/error') ||
                     request.nextUrl.pathname.startsWith('/auth/success');

  // Allow auth flow pages for everyone (they handle their own redirects)
  if (isAuthFlow) {
    return response;
  }

  // Redirect authenticated users from login/register to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
