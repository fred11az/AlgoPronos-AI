import { execSync, spawnSync } from 'child_process';

/**
 * 1xBet JSON Feed Service
 * Uses the confirmed /service-api/LineFeed/GetSportsZip endpoint
 * Returns up to 429+ matches across all sports (football, tennis, basketball, etc.)
 */
export interface OneXBetMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  country: string;
  date: number; // Unix timestamp
  matchCount: number; // Number of individual matches in this league
  score?: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

class OneXBetFeedService {
  private readonly BASE_URL = 'https://1xbet.bj';
  private readonly PARTNER_ID = '1014';

  /**
   * Fetch with curl for maximum reliability
   */
  private fetchWithCurl(url: string, compressed: boolean = false): Buffer | null {
    try {
      const args = [
        '-s', '-L', '--ssl-no-revoke',
        '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '-H', 'Accept: application/json, */*',
        '-H', 'X-Requested-With: XMLHttpRequest',
        '-H', `Referer: ${this.BASE_URL}/`,
        '--max-time', '25',
        url
      ];
      if (compressed) args.splice(3, 0, '--compressed');

      const r = spawnSync('curl.exe', args, { maxBuffer: 50 * 1024 * 1024, timeout: 30000 });

      if (r.error) { console.error('[1xBetFeed] curl error:', r.error.message); return null; }
      if (r.status !== 0) { console.warn('[1xBetFeed] curl exited with code:', r.status); return null; }
      if (!r.stdout || !r.stdout.length) { console.warn('[1xBetFeed] curl returned empty buffer for', url); return null; }
      return r.stdout;
    } catch (e: any) {
      console.error('[1xBetFeed] fetchWithCurl exception:', e.message);
      return null;
    }
  }

  /**
   * Fetches match data from GetChampZip for a set of championships
   */
  async getPrematchOdds(sportId: number = 0): Promise<OneXBetMatch[]> {
    const sId = sportId > 0 ? sportId : 1; 
    console.log(`[1xBetFeed] Discovering leagues for sport ${sId}...`);

    // 1. Discover leagues
    const leagues = await this.getLeaguesFallback(sId);
    if (!leagues.length) return [];

    // 2. Fetch games for the top leagues (limit to first 5 for speed)
    const topLeagues = leagues.slice(0, 5);
    const allGames: OneXBetMatch[] = [];

    console.log(`[1xBetFeed] Fetching individual games for ${topLeagues.length} leagues in parallel...`);

    const promises = topLeagues.map(async (league) => {
      const url = `${this.BASE_URL}/service-api/LineFeed/GetChampZip?champId=${league.id}&lng=fr&tf=255&tz=3&mode=4&partner=${this.PARTNER_ID}&getGames=1`;
      const buf = this.fetchWithCurl(url, true);
      if (!buf) return;

      try {
        const text = buf.toString('utf8').trim().replace(/^\ufeff/, '');
        const d = JSON.parse(text);
        if (d.Success && d.Value && Array.isArray(d.Value)) {
          d.Value.forEach((lNode: any) => {
            if (lNode.G && Array.isArray(lNode.G)) {
              lNode.G.forEach((g: any) => {
                allGames.push({
                  id: g.I,
                  homeTeam: g.O1 || 'Equipe A',
                  awayTeam: g.O2 || 'Equipe B',
                  league: lNode.L || lNode.LE || league.league,
                  sport: league.sport,
                  country: '',
                  date: g.ST || Math.floor(Date.now() / 1000),
                  matchCount: 1,
                  score: g.SC?.FS?.S1 !== undefined ? `${g.SC.FS.S1}-${g.SC.FS.S2}` : undefined,
                  odds: {
                    home: g.E?.find((e: any) => e.T === 1)?.C || 0,
                    draw: g.E?.find((e: any) => e.T === 2)?.C || 0,
                    away: g.E?.find((e: any) => e.T === 3)?.C || 0,
                  }
                });
              });
            }
          });
        }
      } catch (err: any) {
        console.warn(`[1xBetFeed] Error parsing games for league ${league.id}: ${err.message}`);
      }
    });

    await Promise.all(promises);

    // If we couldn't find any individual games, return the league summaries
    if (allGames.length === 0) {
      console.log('[1xBetFeed] No individual games found, returning league summaries');
      return leagues;
    }

    console.log(`[1xBetFeed] Successfully extracted ${allGames.length} individual matches`);
    return allGames;
  }

  /**
   * Simple league discovery (GetSportsZip)
   */
  private async getLeaguesFallback(sportId: number): Promise<OneXBetMatch[]> {
    const params = sportId > 0 ? `sports=${sportId}&lng=fr&tf=255&tz=3&mode=4&partner=${this.PARTNER_ID}` : `lng=fr&tf=255&tz=3&mode=4&partner=${this.PARTNER_ID}`;
    const url = `${this.BASE_URL}/service-api/LineFeed/GetSportsZip?${params}`;
    const buf = this.fetchWithCurl(url);
    if (!buf) return [];
    
    try {
      const json = JSON.parse(buf.toString('utf8'));
      const matches: OneXBetMatch[] = [];
      json.Value?.forEach((sport: any) => {
        if (sport.I === 2999) return;
        sport.L?.forEach((league: any) => {
          matches.push({
            id: league.LI,
            homeTeam: league.L || league.LE || '',
            awayTeam: `${league.GC || 0} match${(league.GC || 0) > 1 ? 's' : ''} disponible`,
            league: league.LE || league.L || '',
            sport: sport.N || 'Football',
            country: '',
            date: Math.floor(Date.now() / 1000),
            matchCount: league.GC || 0,
          });
        });
      });
      return matches;
    } catch { return []; }
  }

  /**
   * Get total match count for all sports (quick check)
   */
  async getTotalMatchCount(): Promise<number> {
    const matches = await this.getPrematchOdds(0);
    return matches.reduce((acc, m) => acc + m.matchCount, 0);
  }

  /**
   * Generates a "Deep Link" to 1xBet for a specific match.
   */
  getDeepLink(matchId: number): string {
    const affiliateUrl = process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L';
    return `${affiliateUrl}&subid=${matchId}`;
  }
}

export const oneXBetFeed = new OneXBetFeedService();
