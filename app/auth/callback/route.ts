import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', { error, errorCode, errorDescription });

    // Build error redirect URL
    const errorUrl = new URL('/auth/error', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    if (errorCode) errorUrl.searchParams.set('error_code', errorCode);
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription);

    return NextResponse.redirect(errorUrl);
  }

  // If no code, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/auth/error?error=config_error', requestUrl.origin));
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handle cookie error in server components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.delete({ name, ...options });
        } catch {
          // Handle cookie error in server components
        }
      },
    },
  });

  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);

      const errorUrl = new URL('/auth/error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'exchange_failed');
      errorUrl.searchParams.set('error_description', exchangeError.message);

      return NextResponse.redirect(errorUrl);
    }

    // Success! Redirect to intended destination
    const successUrl = new URL('/auth/success', requestUrl.origin);
    successUrl.searchParams.set('next', next);

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error('Auth callback unexpected error:', err);

    const errorUrl = new URL('/auth/error', requestUrl.origin);
    errorUrl.searchParams.set('error', 'unexpected_error');

    return NextResponse.redirect(errorUrl);
  }
}
