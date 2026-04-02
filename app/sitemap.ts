import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { worldCupMatches } from '@/lib/worldcup2026';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://algopronos.com';

const COUNTRY_SLUGS = [
  'benin', 'cote-divoire', 'senegal', 'cameroun', 'mali',
  'togo', 'burkina-faso', 'niger', 'congo', 'gabon', 'guinee', 'madagascar',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Coupe du Monde 2026 — individual match pages
  const worldCupMatchPages: MetadataRoute.Sitemap = worldCupMatches.map((m) => ({
    url: `${BASE_URL}/coupe-du-monde-2026/${m.slug}`,
    lastModified: new Date(m.date),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/pronostics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/matchs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    // Coupe du Monde 2026
    { url: `${BASE_URL}/coupe-du-monde-2026`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/actualites`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    // Concepts
    { url: `${BASE_URL}/concept-montante`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/concept-optimus`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/compte-optimise-ia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
    ...COUNTRY_SLUGS.map((slug) => ({
      url: `${BASE_URL}/1xbet/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...worldCupMatchPages,
  ];

  try {
    const supabase = await createClient();

    // News articles — individual pages
    const { data: newsData } = await supabase
      .from('news_articles')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const newsPages: MetadataRoute.Sitemap = (newsData ?? []).map((n) => ({
      url: `${BASE_URL}/actualites/${n.slug}`,
      lastModified: new Date(n.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

    const [matchesResult1, matchesResult2, matchesResult3, leaguesResult, teamsResult1, teamsResult2] = await Promise.all([
      supabase
        .from('match_predictions')
        .select('slug, created_at')
        .order('match_date', { ascending: false })
        .range(0, 999),
      supabase
        .from('match_predictions')
        .select('slug, created_at')
        .order('match_date', { ascending: false })
        .range(1000, 1999),
      supabase
        .from('match_predictions')
        .select('slug, created_at')
        .order('match_date', { ascending: false })
        .range(2000, 2999),
      // All leagues — rich content pages deserve indexing
      supabase
        .from('match_predictions')
        .select('league_slug')
        .limit(5000),
      // All teams batch 1 — rich content pages deserve indexing
      supabase
        .from('match_predictions')
        .select('home_team_slug, away_team_slug')
        .range(0, 2499),
      // All teams batch 2
      supabase
        .from('match_predictions')
        .select('home_team_slug, away_team_slug')
        .range(2500, 4999),
    ]);

    const matchPages: MetadataRoute.Sitemap = [
      ...(matchesResult1.data || []),
      ...(matchesResult2.data || []),
      ...(matchesResult3.data || []),
    ].map((m) => ({
      url: `${BASE_URL}/pronostic/${m.slug}`,
      lastModified: new Date(m.created_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const leaguePages: MetadataRoute.Sitemap = Array.from(
      new Set((leaguesResult.data || []).map((l) => l.league_slug))
    ).map((slug) => ({
      url: `${BASE_URL}/ligue/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const allTeamSlugs = [
      ...((teamsResult1.data || []).map((t) => t.home_team_slug)),
      ...((teamsResult1.data || []).map((t) => t.away_team_slug)),
      ...((teamsResult2.data || []).map((t) => t.home_team_slug)),
      ...((teamsResult2.data || []).map((t) => t.away_team_slug)),
    ];
    const teamPages: MetadataRoute.Sitemap = Array.from(new Set(allTeamSlugs)).map((slug) => ({
      url: `${BASE_URL}/equipe/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...newsPages, ...matchPages, ...leaguePages, ...teamPages];
  } catch {
    return staticPages;
  }
}
