// API-Football match service
// Docs: https://www.api-football.com/documentation-v3
// Set FOOTBALL_API_KEY in your environment variables

import { createAdminClient } from '@/lib/supabase/server';

export interface RealMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueCode: string;
  country: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

interface OddsValue {
  value: string;
  odd: string;
}

interface RawFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; country: string };
  teams: { home: { name: string }; away: { name: string } };
}

class MatchService {
  /**
   * Fetch all matches for a date range in 2 API calls total (fixtures + odds).
   * Much more efficient than one call per day.
   * Returns { byDate, apiErrors, rawFixturesCount }
   */
  async getMatchesForRange(
    from: string,
    to: string,
  ): Promise<{ byDate: Record<string, RealMatch[]>; apiErrors: string[]; rawFixturesCount: number }> {
    const byDate: Record<string, RealMatch[]> = {};
    const apiErrors: string[] = [];
    let rawFixturesCount = 0;

    // Build list of dates in range
    const dates: string[] = [];
    const cursor = new Date(from);
    const end = new Date(to);
    while (cursor <= end) {
      dates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    console.log(`[Sync] EXHAUSTIVE Sync for ${dates.length} days. Primary source: Flashscore (OpenClaw).`);

    for (const date of dates) {
      // ── 1. PRIMARY: OpenClaw (Flashscore) ───────────────────────────────────
      console.log(`[Sync] ${date}: Attempting Flashscore capture via OpenClaw...`);
      const openClawMatches = await this.searchMatchesWithOpenClaw(date);
      
      if (openClawMatches.length > 0) {
        console.log(`[Sync] ${date}: Success! Captured ${openClawMatches.length} matches via Flashscore.`);
        byDate[date] = openClawMatches;
        await this.cacheMatches(date, openClawMatches);
        continue; // Move to next date, primary source succeeded
      }

      // ── 2. FALLBACK: API-Football (if OpenClaw fails or returns nothing) ─────
      console.log(`[Sync] ${date}: Flashscore empty/failed. Attempting API-Football fallback...`);
      const apiKey = process.env.FOOTBALL_API_KEY;
      if (!apiKey) {
        console.warn(`[Sync] ${date}: No API-Football key found. Skipping fallback.`);
        continue;
      }

      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${date}`,
          { headers: { 'x-apisports-key': apiKey } }
        );
        if (res.ok) {
          const data = await res.json();
          const fixtures = data.response ?? [];
          rawFixturesCount += fixtures.length;
          
          if (fixtures.length > 0) {
            const mappedMatches = fixtures.map((f: any) => {
              const leagueCode = this.mapAPIFootballLeague(f.league.id) || 'TOP';
              return {
                id: `apif-${f.fixture.id}`,
                homeTeam: f.teams.home.name,
                awayTeam: f.teams.away.name,
                league: f.league.name,
                leagueCode,
                country: f.league.country,
                date: date,
                time: new Date(f.fixture.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
                status: this.mapAPIFootballStatus(f.fixture.status.short),
                odds: this.generateRealisticOdds(),
              };
            });
            byDate[date] = mappedMatches;
            await this.cacheMatches(date, mappedMatches);
            console.log(`[Sync] ${date}: Fallback success. Cached ${mappedMatches.length} matches from API-Football.`);
          }
        }
      } catch (e) {
        apiErrors.push(`Fallback error for ${date}: ${String(e)}`);
      }
    }

    return { byDate, apiErrors, rawFixturesCount };
  }

  /**
   * Use OpenClaw to search the web for matches and odds.
   */
  private async searchMatchesWithOpenClaw(date: string): Promise<RealMatch[]> {
    const url = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18790/v1/chat/completions';
    const token = process.env.OPENCLAW_GATEWAY_TOKEN;

    if (!token) {
      console.warn('[MatchService] OPENCLAW_GATEWAY_TOKEN not set — cannot search web.');
      return [];
    }

    const prompt = `PARCOURS EXHAUSTIF : Consulte les sites Flashscore.com ou Flashscore.fr pour trouver ABSOLUMENT TOUS les matchs de football du ${date} dans le monde entier. 
Ne te limite pas aux grandes ligues. Je veux des milliers de matchs si nécessaire.
Inclus impérativement : 
- TOUTES les ligues européennes (Div 1, Div 2, Div 3, Coupes).
- TOUTES les ligues africaines sans exception (Bénin, Côte d'Ivoire, Sénégal, Cameroun, Mali, Togo, Burkina, Niger, Congo, Gabon, Guinée, Madagascar, etc.).
- TOUTES les ligues d'Amérique Latine, Asie et Océanie.
- Matchs amicaux, compétitions de jeunes et football féminin.
Pour CHAQUE match trouvé, récupère : l'équipe à domicile, l'équipe à l'extérieur, la ligue exacte, l'heure locale (HH:mm) et les VRAIES COTES (1, N, 2) de Flashscore.
Réponds UNIQUEMENT en JSON sous la forme d'un tableau d'objets (si la liste est trop longue, fournis au moins les 500 premiers les plus importants) : 
[
  { 
    "homeTeam": "...", 
    "awayTeam": "...", 
    "league": "...", 
    "time": "...", 
    "odds": { "home": 1.5, "draw": 3.4, "away": 5.2 } 
  }
]`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'openclaw',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Low temp for more stable JSON
        }),
      });

      if (!res.ok) {
        console.error(`[MatchService] OpenClaw search error: ${res.status}`);
        return [];
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return [];

      // Extract JSON if AI wrapped it in markdown
      const jsonStr = content.match(/\[[\s\S]*\]/)?.[0] || content;
      const results = JSON.parse(jsonStr);

      if (!Array.isArray(results)) return [];

      return results.map((r: any, index: number) => ({
        id: `openclaw-${date}-${index}`,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        league: r.league,
        leagueCode: 'TOP',
        country: '',
        date: date,
        time: r.time,
        status: 'scheduled',
        odds: (r.odds && r.odds.home > 0) ? r.odds : this.generateRealisticOdds(),
      }));
    } catch (err) {
      console.error('[MatchService] OpenClaw search failed:', err);
      return [];
    }
  }

  // Single-date fetch (reads from cache first, falls back to range fetch)
  async getMatchesForDate(date: string, leagueCodes?: string[]): Promise<RealMatch[]> {
    const cached = await this.getCachedMatches(date);
    if (cached && cached.length > 0) {
      if (!leagueCodes || leagueCodes.length === 0) return cached;
      return cached.filter((m) => leagueCodes.includes(m.leagueCode));
    }

    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      console.warn('[MatchService] FOOTBALL_API_KEY not set and no cache found — returning empty matches.');
      return [];
    }

    // Fetch just this date if not cached
    const { byDate } = await this.getMatchesForRange(date, date);
    const matches = byDate[date] ?? [];
    if (!leagueCodes || leagueCodes.length === 0) return matches;
    return matches.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  private async getCachedMatches(date: string): Promise<RealMatch[] | null> {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('matches_cache')
        .select('matches')
        .eq('date', date)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.matches as RealMatch[];
    } catch {
      return null;
    }
  }

  private async cacheMatches(date: string, matches: RealMatch[]): Promise<void> {
    try {
      const supabase = createAdminClient();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

      await supabase.from('matches_cache').delete().eq('date', date);

      await supabase.from('matches_cache').insert({
        date,
        leagues: Array.from(new Set(matches.map((m) => m.leagueCode))),
        matches,
        expires_at: expiresAt,
      });

      console.log(`Cached ${matches.length} matches for ${date}`);
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  private mapAPIFootballStatus(status: string): 'scheduled' | 'live' | 'finished' {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
    const finishedStatuses = ['FT', 'AET', 'PEN', 'SUSP', 'INT', 'ABD', 'AWD', 'WO'];
    if (liveStatuses.includes(status)) return 'live';
    if (finishedStatuses.includes(status)) return 'finished';
    return 'scheduled';
  }

  private mapAPIFootballLeague(leagueId: number): string | null {
    const mapping: Record<number, string> = {
      // Europe Top 5
      39: 'PL',    // Premier League
      140: 'LA',   // La Liga
      135: 'SA',   // Serie A
      78: 'BL',    // Bundesliga
      61: 'FL',    // Ligue 1
      // European competitions
      2: 'CL',     // Champions League
      3: 'EL',     // Europa League
      848: 'ECL',  // Conference League
      // Other Europe
      94: 'PT1',   // Primeira Liga
      88: 'NL1',   // Eredivisie
      144: 'BE1',  // Pro League Belgium
      203: 'TR1',  // Süper Lig
      235: 'RU1',  // Russian Premier League
      179: 'SC1',  // Scottish Premiership
      197: 'GR1',  // Super League Greece
      207: 'CH1',  // Super League Switzerland
      218: 'AT1',  // Bundesliga Austria
      // Americas
      71: 'BR1',   // Brasileirão
      128: 'AR1',  // Liga Profesional Argentina
      262: 'MX1',  // Liga MX
      253: 'US1',  // MLS
      11: 'COPA',  // Copa Libertadores
      // Africa — continental
      6: 'CAN',       // AFCON (CAN)
      12: 'CAF_CL',   // CAF Champions League
      20: 'CAF_CC',   // CAF Confederation Cup
      // Africa — national leagues
      233: 'EG1',  // Egyptian Premier League
      200: 'MA1',  // Botola Pro Maroc
      248: 'TN1',  // Ligue Professionnelle 1 Tunisie
      187: 'DZ1',  // Ligue Professionnelle 1 Algérie
      329: 'NG1',  // NPFL Nigeria
      414: 'GH1',  // Ghana Premier League
      480: 'CI1',  // Ligue 1 Côte d'Ivoire
      453: 'CM1',  // Elite One Cameroun
      576: 'SN1',  // Ligue 1 Sénégal
      669: 'BJ1',  // Championnat National Bénin
      // Asia
      307: 'SA1',  // Saudi Pro League
      98: 'JP1',   // J-League
      292: 'KR1',  // K-League
      188: 'AU1',  // A-League
    };
    return mapping[leagueId] || null;
  }

  private generateRealisticOdds(): { home: number; draw: number; away: number } {
    const homeBase = 1.4 + Math.random() * 2.2;
    const drawBase = 2.8 + Math.random() * 1.5;
    const awayBase = 2.0 + Math.random() * 3.0;

    return {
      home: Math.round(homeBase * 100) / 100,
      draw: Math.round(drawBase * 100) / 100,
      away: Math.round(awayBase * 100) / 100,
    };
  }
}

export const matchService = new MatchService();
