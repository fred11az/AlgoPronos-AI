import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ANONYMOUS_COOKIE_CONFIG } from '@/lib/anonymous/types';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyAdmin } from '@/lib/services/notification-service';

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
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);

      const errorUrl = new URL('/auth/error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'exchange_failed');
      errorUrl.searchParams.set('error_description', exchangeError.message);

      return NextResponse.redirect(errorUrl);
    }

    // Check for anonymous session and convert if exists
    const anonymousSessionId = cookieStore.get(ANONYMOUS_COOKIE_CONFIG.name)?.value;

    if (anonymousSessionId && sessionData?.user?.id) {
      try {
        // Use admin client to bypass RLS
        const adminSupabase = createAdminClient();

        // Update anonymous session to link it to the new user
        await adminSupabase
          .from('anonymous_sessions')
          .update({
            converted_to_user_id: sessionData.user.id,
            converted_at: new Date().toISOString(),
          })
          .eq('anonymous_id', anonymousSessionId);

        // Log the conversion event
        const { data: session } = await adminSupabase
          .from('anonymous_sessions')
          .select('id')
          .eq('anonymous_id', anonymousSessionId)
          .single();

        if (session) {
          await adminSupabase.from('anonymous_session_events').insert({
            anonymous_session_id: session.id,
            event_type: 'session_converted',
            event_data: { userId: sessionData.user.id },
          });
        }

        // Clear the anonymous session cookie
        cookieStore.delete(ANONYMOUS_COOKIE_CONFIG.name);

        console.log('Anonymous session converted for user:', sessionData.user.id);
      } catch (conversionError) {
        // Log but don't fail the auth flow if conversion fails
        console.error('Error converting anonymous session:', conversionError);
      }
    }

    // 🏆 Success! Redirect to intended destination
    const user = sessionData?.user;
    if (user?.email) {
      // Notify Admin that registration is now COMPLETED
      await notifyAdmin('signup', { 
        email: user.email, 
        fullName: user.user_metadata?.full_name,
        phone: user.user_metadata?.phone,
        country: user.user_metadata?.country
      }, 'confirmed');
      console.log('[auth/callback] Email confirmed for user:', user.email);
    }

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
