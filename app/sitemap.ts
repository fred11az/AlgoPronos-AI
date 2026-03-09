import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://algopronos.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/compte-optimise-ia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/dashboard/generate`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/classement`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Dynamic: match predictions
  let matchPages: MetadataRoute.Sitemap = [];
  let leaguePages: MetadataRoute.Sitemap = [];
  let teamPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Upcoming match predictions
    const { data: matches } = await supabase
      .from('match_predictions')
      .select('slug, match_date, created_at')
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(500);

    if (matches) {
      matchPages = matches.map((m) => ({
        url: `${BASE_URL}/pronostic/${m.slug}`,
        lastModified: new Date(m.created_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }

    // League pages (distinct leagues)
    const { data: leagues } = await supabase
      .from('match_predictions')
      .select('league_slug')
      .gte('match_date', today);

    if (leagues) {
      const uniqueLeagueSlugs = [...new Set(leagues.map((l) => l.league_slug))];
      leaguePages = uniqueLeagueSlugs.map((slug) => ({
        url: `${BASE_URL}/ligue/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }));
    }

    // Team pages (distinct teams)
    const { data: homeTeams } = await supabase
      .from('match_predictions')
      .select('home_team_slug')
      .gte('match_date', today);

    const { data: awayTeams } = await supabase
      .from('match_predictions')
      .select('away_team_slug')
      .gte('match_date', today);

    if (homeTeams && awayTeams) {
      const allTeamSlugs = [
        ...homeTeams.map((t) => t.home_team_slug),
        ...awayTeams.map((t) => t.away_team_slug),
      ];
      const uniqueTeamSlugs = [...new Set(allTeamSlugs)];
      teamPages = uniqueTeamSlugs.map((slug) => ({
        url: `${BASE_URL}/equipe/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Fail gracefully — return static pages only
  }

  return [...staticPages, ...matchPages, ...leaguePages, ...teamPages];
}
