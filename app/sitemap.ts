import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://algopronos.com';

/**
 * Fragment the sitemap to handle 50k+ URLs.
 */
export async function generateSitemaps() {
  // 0: Static, 1-2: Matches, 3: Leagues/Teams
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  if (id === 0) {
    const COUNTRY_SLUGS = [
      'benin', 'cote-divoire', 'senegal', 'cameroun', 'mali',
      'togo', 'burkina-faso', 'niger', 'congo', 'gabon', 'guinee', 'madagascar',
    ];

    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${BASE_URL}/pronostics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
      { url: `${BASE_URL}/matchs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${BASE_URL}/concept-montante`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
      { url: `${BASE_URL}/concept-optimus`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
      { url: `${BASE_URL}/compte-optimise-ia`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
      ...COUNTRY_SLUGS.map((slug) => ({
        url: `${BASE_URL}/1xbet/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    ];
  }

  if (id === 1 || id === 2) {
    const offset = (id - 1) * 1000;
    const { data: matches } = await supabase
      .from('match_predictions')
      .select('slug, created_at')
      .order('match_date', { ascending: false })
      .range(offset, offset + 999);

    if (!matches) return [];
    return matches.map((m) => ({
      url: `${BASE_URL}/pronostic/${m.slug}`,
      lastModified: new Date(m.created_at || new Date()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  }

  if (id === 3) {
    const { data: leagues } = await supabase
      .from('match_predictions')
      .select('league_slug')
      .limit(1000);

    const { data: teams } = await supabase
      .from('match_predictions')
      .select('home_team_slug, away_team_slug')
      .limit(1000);

    const leaguePages = Array.from(new Set(leagues?.map(l => l.league_slug) || [])).map(slug => ({
      url: `${BASE_URL}/ligue/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const allTeamSlugs = [
      ...(teams?.map(t => t.home_team_slug) || []),
      ...(teams?.map(t => t.away_team_slug) || []),
    ];
    const teamPages = Array.from(new Set(allTeamSlugs)).map(slug => ({
      url: `${BASE_URL}/equipe/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...leaguePages, ...teamPages];
  }

  return [];
}
