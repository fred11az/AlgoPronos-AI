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
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      console.warn('[MatchService] FOOTBALL_API_KEY not set — returning empty matches. Add it to your Vercel environment variables.');
      return { byDate: {}, apiErrors: ['FOOTBALL_API_KEY environment variable is not set'], rawFixturesCount: 0 };
    }

    // Build list of dates in range
    const dates: string[] = [];
    const cursor = new Date(from);
    const end = new Date(to);
    while (cursor <= end) {
      dates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    console.log(`[API-Football] Fetching fixtures for ${dates.length} days (free plan: 1 req/day)`);

    // ── 1. Fixtures day by day (free plan doesn't support from/to range) ──────
    const allFixtures: RawFixture[] = [];
    const apiErrors: string[] = [];
    for (const date of dates) {
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${date}`,
          { headers: { 'x-apisports-key': apiKey } }
        );
        if (!res.ok) {
          const errMsg = `HTTP ${res.status} for ${date}`;
          console.warn(`[API-Football] ${errMsg}`);
          apiErrors.push(errMsg);
          continue;
        }
        const data = await res.json();
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errMsg = `API error for ${date}: ${JSON.stringify(data.errors)}`;
          console.warn(`[API-Football] ${errMsg}`);
          apiErrors.push(errMsg);
          continue;
        }
        allFixtures.push(...(data.response ?? []));
        console.log(`[API-Football] ${date}: ${(data.response ?? []).length} fixtures`);
      } catch (e) {
        const errMsg = `fetch error for ${date}: ${String(e)}`;
        console.warn(`[API-Football] ${errMsg}`);
        apiErrors.push(errMsg);
      }
    }

    const fixtures: RawFixture[] = allFixtures;
    console.log(`[API-Football] Got ${fixtures.length} total fixtures across ${dates.length} days`);

    // ── 2. Odds pour aujourd'hui (best effort — plan gratuit limité) ──────────
    const oddsMap: Record<number, { home: number; draw: number; away: number }> = {};
    try {
      const oddsRes = await fetch(
        `https://v3.football.api-sports.io/odds?date=${from}&bookmaker=8&bet=1`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      if (oddsRes.ok) {
        const oddsData = await oddsRes.json();
        for (const item of (oddsData.response ?? [])) {
          const fid: number = item.fixture?.id;
          const values = item.bookmakers?.[0]?.bets?.[0]?.values ?? [];
          const home = values.find((v: OddsValue) => v.value === 'Home')?.odd;
          const draw = values.find((v: OddsValue) => v.value === 'Draw')?.odd;
          const away = values.find((v: OddsValue) => v.value === 'Away')?.odd;
          if (fid && home && draw && away) {
            oddsMap[fid] = { home: parseFloat(home), draw: parseFloat(draw), away: parseFloat(away) };
          }
        }
      }
    } catch {
      // Odds unavailable — will use generated odds as fallback
    }

    // ── 3. Group matches by date ──────────────────────────────────────────────
    const byDate: Record<string, RealMatch[]> = {};

    for (const fixture of fixtures) {
      const leagueCode = this.mapAPIFootballLeague(fixture.league.id);
      if (!leagueCode) continue;

      const fid: number = fixture.fixture.id;
      const matchDate = fixture.fixture.date.split('T')[0];
      const matchTime = new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });

      const match: RealMatch = {
        id: `apif-${fid}`,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        league: fixture.league.name,
        leagueCode,
        country: fixture.league.country,
        date: matchDate,
        time: matchTime,
        status: this.mapAPIFootballStatus(fixture.fixture.status.short),
        odds: oddsMap[fid] ?? this.generateRealisticOdds(),
      };

      if (!byDate[matchDate]) byDate[matchDate] = [];
      byDate[matchDate].push(match);
    }

    // ── 4. Cache each day's matches ───────────────────────────────────────────
    for (const [date, matches] of Object.entries(byDate)) {
      if (matches.length > 0) {
        await this.cacheMatches(date, matches);
      }
    }

    console.log(`[API-Football] Grouped into ${Object.keys(byDate).length} days, ${fixtures.length} total`);
    return { byDate, apiErrors, rawFixturesCount: allFixtures.length };
  }

  // Single-date fetch (reads from cache first, falls back to range fetch)
  async getMatchesForDate(date: string, leagueCodes?: string[]): Promise<RealMatch[]> {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      console.warn('[MatchService] FOOTBALL_API_KEY not set — returning empty matches.');
      return [];
    }

    const cached = await this.getCachedMatches(date);
    if (cached && cached.length > 0) {
      if (!leagueCodes || leagueCodes.length === 0) return cached;
      return cached.filter((m) => leagueCodes.includes(m.leagueCode));
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
