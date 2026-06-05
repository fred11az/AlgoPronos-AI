import { createClient } from '@supabase/supabase-js';

export interface FlashscoreScrapedStats {
  homeForm: string;           // e.g. "WWDLW"
  awayForm: string;           // e.g. "LDWWD"
  homeGoalsForAvg: number;    // Average goals scored (last 5 matches)
  homeGoalsAgainstAvg: number;// Average goals conceded (last 5 matches)
  awayGoalsForAvg: number;
  awayGoalsAgainstAvg: number;
  homeRank: number | null;    // standing rank
  awayRank: number | null;    // standing rank
  h2h: Array<{
    homeGoals: number;
    awayGoals: number;
    winner: 'home' | 'away' | 'draw';
  }>;
  preMatchInfo: string | null; // injuries, key details, weather, etc.
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export class FlashscoreScraper {
  /**
   * Search for a match on Flashscore and scrape stats (form, standings, H2H, info) using Firecrawl.
   * Caches results in Supabase api_cache for 12 hours to save Firecrawl credits.
   */
  static async getMatchStats(homeTeam: string, awayTeam: string): Promise<FlashscoreScrapedStats | null> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.warn('[Flashscore Scraper] Missing FIRECRAWL_API_KEY');
      return null;
    }

    const cacheKey = `flashscore:stats:${homeTeam.toLowerCase().trim()}:${awayTeam.toLowerCase().trim()}`;
    const supabase = getSupabase();

    // 1. Check cache first
    try {
      const { data: cached, error: cacheError } = await supabase
        .from('api_cache')
        .select('data, fetched_at')
        .eq('cache_key', cacheKey)
        .single();

      if (cached && !cacheError) {
        const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 1000;
        const ttl = 12 * 3600; // 12 hours
        if (age < ttl) {
          console.log(`[Flashscore Scraper] Cache HIT for ${homeTeam} vs ${awayTeam}`);
          return cached.data as FlashscoreScrapedStats;
        }
      }
    } catch (err) {
      // Ignore cache check errors
    }

    console.log(`[Flashscore Scraper] Cache MISS. Scraping ${homeTeam} vs ${awayTeam}...`);

    try {
      // Step A: Search for the match on Flashscore via Firecrawl Search API
      const searchQuery = `site:flashscore.com "${homeTeam}" "${awayTeam}" H2H standings form`;
      const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 1
        })
      });

      if (!searchRes.ok) {
        throw new Error(`Firecrawl Search failed: ${searchRes.status} ${searchRes.statusText}`);
      }

      const searchJson = await searchRes.json();
      const firstResult = searchJson?.data?.[0];
      const matchUrl = firstResult?.url;

      if (!matchUrl) {
        throw new Error(`Could not find a Flashscore URL for ${homeTeam} vs ${awayTeam}`);
      }

      console.log(`[Flashscore Scraper] Found match URL: ${matchUrl}. Scraping details...`);

      // Step B: Scrape the match page with structured JSON extraction
      const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: matchUrl,
          formats: ['json'],
          jsonOptions: {
            schema: {
              type: 'object',
              properties: {
                homeForm: { type: 'string', description: 'Form of the home team in last 5 matches, e.g., WWDLW or GNGPP' },
                awayForm: { type: 'string', description: 'Form of the away team in last 5 matches, e.g., LDWWD or PGGNP' },
                homeGoalsForAvg: { type: 'number', description: 'Average goals scored by home team in recent matches' },
                homeGoalsAgainstAvg: { type: 'number', description: 'Average goals conceded by home team in recent matches' },
                awayGoalsForAvg: { type: 'number', description: 'Average goals scored by away team in recent matches' },
                awayGoalsAgainstAvg: { type: 'number', description: 'Average goals conceded by away team in recent matches' },
                homeRank: { type: 'number', description: 'League standing/ranking table position of the home team' },
                awayRank: { type: 'number', description: 'League standing/ranking table position of the away team' },
                h2h: {
                  type: 'array',
                  description: 'List of past head to head matches between these two teams',
                  items: {
                    type: 'object',
                    properties: {
                      homeGoals: { type: 'number' },
                      awayGoals: { type: 'number' },
                      winner: { type: 'string', enum: ['home', 'away', 'draw'] }
                    },
                    required: ['homeGoals', 'awayGoals', 'winner']
                  }
                },
                preMatchInfo: { type: 'string', description: 'Injuries, suspensions, key players, or comments about the match' }
              },
              required: ['homeForm', 'awayForm']
            }
          }
        })
      });

      if (!scrapeRes.ok) {
        throw new Error(`Firecrawl Scrape failed: ${scrapeRes.status} ${scrapeRes.statusText}`);
      }

      const scrapeJson = await scrapeRes.json();
      const extracted: FlashscoreScrapedStats = scrapeJson?.data?.json;

      if (!extracted || !extracted.homeForm) {
        throw new Error('Firecrawl structured extraction returned empty or invalid data');
      }

      // Ensure defaults for optional/nullable fields
      const result: FlashscoreScrapedStats = {
        homeForm: extracted.homeForm || 'N/A',
        awayForm: extracted.awayForm || 'N/A',
        homeGoalsForAvg: extracted.homeGoalsForAvg ?? 1.2,
        homeGoalsAgainstAvg: extracted.homeGoalsAgainstAvg ?? 1.2,
        awayGoalsForAvg: extracted.awayGoalsForAvg ?? 1.2,
        awayGoalsAgainstAvg: extracted.awayGoalsAgainstAvg ?? 1.2,
        homeRank: extracted.homeRank ?? null,
        awayRank: extracted.awayRank ?? null,
        h2h: Array.isArray(extracted.h2h) ? extracted.h2h : [],
        preMatchInfo: extracted.preMatchInfo || null
      };

      // 2. Cache the result in Supabase
      try {
        await supabase.from('api_cache').upsert({
          cache_key: cacheKey,
          data: result,
          fetched_at: new Date().toISOString()
        });
      } catch (cacheErr) {
        // Ignore cache save errors
      }

      return result;
    } catch (err: any) {
      console.error(`[Flashscore Scraper] Failed for ${homeTeam} vs ${awayTeam}:`, err.message);
      return null;
    }
  }
}
