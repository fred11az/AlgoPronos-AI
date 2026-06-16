import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/onboarding',
          '/unlock-vip',
          '/try-free',
          '/auth/callback',
          '/auth/success',
          '/auth/error',
          '/redirect',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/onboarding', '/unlock-vip', '/try-free'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-Mobile',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/login', '/onboarding'],
      },
    ],
    sitemap: 'https://algopronos.com/sitemap.xml',
    host: 'https://algopronos.com',
  };
}
