import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Maps ISO 3166-1 alpha-2 country code → 1xBet landing page slug
const GEO_COUNTRY_MAP: Record<string, string> = {
  SN: 'senegal',
  CI: 'cote-divoire',
  BJ: 'benin',
  ML: 'mali',
  BF: 'burkina-faso',
  TG: 'togo',
  GN: 'guinee',
  NE: 'niger',
  CM: 'cameroun',
  CG: 'congo',
  GA: 'gabon',
  MG: 'madagascar',
};

// Cookie name — set after first geo-redirect to avoid redirect loop
const GEO_COOKIE = 'ap_geo_redirected';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Geo-redirect: only for homepage, only when no geo-cookie is set yet
  if (pathname === '/' && !request.cookies.has(GEO_COOKIE)) {
    // Vercel sets x-vercel-ip-country automatically on edge.
    // Other platforms may use CF-IPCountry (Cloudflare) or similar.
    const countryCode =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      '';

    const slug = GEO_COUNTRY_MAP[countryCode.toUpperCase()];

    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/1xbet/${slug}`;
      const response = NextResponse.redirect(url, { status: 302 });
      // Set cookie for 7 days so the user can still navigate to "/" freely
      response.cookies.set(GEO_COOKIE, '1', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      });
      return response;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
