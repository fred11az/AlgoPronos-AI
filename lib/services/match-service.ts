// TheSportsDB API service for real match data
// Free API: https://www.thesportsdb.com/api.php
// No API key required for basic usage

import { createClient } from '@/lib/supabase/server';

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

// League mapping from our codes to TheSportsDB league IDs
const leagueMapping: Record<string, { tsdbId: string; name: string; country: string }> = {
  // Europe Top 5
  PL: { tsdbId: '4328', name: 'Premier League', country: 'Angleterre' },
  LA: { tsdbId: '4335', name: 'La Liga', country: 'Espagne' },
  SA: { tsdbId: '4332', name: 'Serie A', country: 'Italie' },
  BL: { tsdbId: '4331', name: 'Bundesliga', country: 'Allemagne' },
  FL: { tsdbId: '4334', name: 'Ligue 1', country: 'France' },
  // European competitions
  CL: { tsdbId: '4480', name: 'Champions League', country: 'Europe' },
  EL: { tsdbId: '4481', name: 'Europa League', country: 'Europe' },
  // Other Europe
  PT1: { tsdbId: '4344', name: 'Primeira Liga', country: 'Portugal' },
  NL1: { tsdbId: '4337', name: 'Eredivisie', country: 'Pays-Bas' },
  BE1: { tsdbId: '4355', name: 'Pro League', country: 'Belgique' },
  TR1: { tsdbId: '4339', name: 'Süper Lig', country: 'Turquie' },
  SC1: { tsdbId: '4330', name: 'Premiership', country: 'Écosse' },
  GR1: { tsdbId: '4358', name: 'Super League', country: 'Grèce' },
  // Americas
  BR1: { tsdbId: '4351', name: 'Brasileirão', country: 'Brésil' },
  AR1: { tsdbId: '4406', name: 'Liga Profesional', country: 'Argentine' },
  MX1: { tsdbId: '4350', name: 'Liga MX', country: 'Mexique' },
  US1: { tsdbId: '4346', name: 'MLS', country: 'USA' },
  // Africa - TheSportsDB IDs
  EG1: { tsdbId: '4406', name: 'Egyptian Premier', country: 'Égypte' },
  MA1: { tsdbId: '4409', name: 'Botola Pro', country: 'Maroc' },
  // Asia
  JP1: { tsdbId: '4350', name: 'J-League', country: 'Japon' },
  SA1: { tsdbId: '4495', name: 'Saudi Pro League', country: 'Arabie Saoudite' },
  AU1: { tsdbId: '4356', name: 'A-League', country: 'Australie' },
};

// Fallback leagues not in TheSportsDB (will be generated)
const fallbackLeagues: Record<string, { name: string; country: string }> = {
  ECL: { name: 'Conference League', country: 'Europe' },
  CAN: { name: 'Coupe d\'Afrique des Nations', country: 'Afrique' },
  CAF_CL: { name: 'Ligue des Champions CAF', country: 'Afrique' },
  CAF_CC: { name: 'Coupe de la Confédération', country: 'Afrique' },
  BJ1: { name: 'Ligue Pro Bénin', country: 'Bénin' },
  CI1: { name: 'Ligue 1 Ivoirienne', country: 'Côte d\'Ivoire' },
  SN1: { name: 'Ligue 1 Sénégalaise', country: 'Sénégal' },
  CM1: { name: 'Elite One', country: 'Cameroun' },
  NG1: { name: 'NPFL Nigeria', country: 'Nigeria' },
  GH1: { name: 'Ghana Premier League', country: 'Ghana' },
  TN1: { name: 'Ligue 1 Tunisie', country: 'Tunisie' },
  DZ1: { name: 'Ligue 1 Algérie', country: 'Algérie' },
  KR1: { name: 'K-League', country: 'Corée du Sud' },
  CH1: { name: 'Super League', country: 'Suisse' },
  AT1: { name: 'Bundesliga', country: 'Autriche' },
  COPA: { name: 'Copa Libertadores', country: 'Amérique du Sud' },
};

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

interface TSDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strLeague: string;
  idLeague: string;
  dateEvent: string;
  strTime: string;
  strStatus?: string;
  intHomeScore?: string;
  intAwayScore?: string;
}

class MatchService {
  // Fetch matches from TheSportsDB
  async fetchFromTSDB(date: string): Promise<RealMatch[]> {
    const matches: RealMatch[] = [];

    try {
      // Format date for API
      const formattedDate = date; // Already in YYYY-MM-DD format

      // Fetch matches for each league we support
      for (const [code, info] of Object.entries(leagueMapping)) {
        try {
          const url = `${BASE_URL}/eventsday.php?d=${formattedDate}&l=${info.tsdbId}`;
          const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

          if (!response.ok) continue;

          const data = await response.json();

          if (data.events && Array.isArray(data.events)) {
            for (const event of data.events as TSDBEvent[]) {
              matches.push({
                id: `tsdb-${event.idEvent}`,
                homeTeam: event.strHomeTeam,
                awayTeam: event.strAwayTeam,
                league: info.name,
                leagueCode: code,
                country: info.country,
                date: event.dateEvent,
                time: event.strTime ? event.strTime.substring(0, 5) : '15:00',
                status: this.mapStatus(event.strStatus),
                odds: this.generateRealisticOdds(),
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching ${code}:`, err);
        }
      }
    } catch (error) {
      console.error('Error fetching from TheSportsDB:', error);
    }

    return matches;
  }

  // Fetch from API-Football if available
  async fetchFromAPIFootball(date: string, apiKey?: string): Promise<RealMatch[]> {
    if (!apiKey) return [];

    const matches: RealMatch[] = [];

    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${date}`,
        {
          headers: {
            'x-apisports-key': apiKey,
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();

      if (data.response && Array.isArray(data.response)) {
        for (const fixture of data.response) {
          // Map to our league codes
          const leagueCode = this.mapAPIFootballLeague(fixture.league.id);
          if (!leagueCode) continue;

          matches.push({
            id: `apif-${fixture.fixture.id}`,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            league: fixture.league.name,
            leagueCode,
            country: fixture.league.country,
            date: date,
            time: new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: this.mapAPIFootballStatus(fixture.fixture.status.short),
            odds: this.generateRealisticOdds(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching from API-Football:', error);
    }

    return matches;
  }

  // Main function to get matches
  async getMatchesForDate(date: string, leagueCodes: string[]): Promise<RealMatch[]> {
    // Check cache first
    const cachedMatches = await this.getCachedMatches(date);
    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`Returning ${cachedMatches.length} cached matches for ${date}`);
      return cachedMatches.filter((m) => leagueCodes.includes(m.leagueCode));
    }

    console.log(`Fetching fresh matches for ${date}...`);

    // Fetch from TheSportsDB (free)
    let allMatches = await this.fetchFromTSDB(date);

    // If API-Football key is available, try to get more matches
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (apiKey) {
      const apiFootballMatches = await this.fetchFromAPIFootball(date, apiKey);
      // Merge, avoiding duplicates
      const existingIds = new Set(allMatches.map((m) => `${m.homeTeam}-${m.awayTeam}`));
      for (const match of apiFootballMatches) {
        const key = `${match.homeTeam}-${match.awayTeam}`;
        if (!existingIds.has(key)) {
          allMatches.push(match);
          existingIds.add(key);
        }
      }
    }

    // Add sample matches for leagues not covered by APIs (African leagues, etc.)
    const coveredLeagues = new Set(allMatches.map((m) => m.leagueCode));
    for (const code of leagueCodes) {
      if (!coveredLeagues.has(code) && fallbackLeagues[code]) {
        const sampleMatches = this.generateSampleMatches(date, code, fallbackLeagues[code]);
        allMatches.push(...sampleMatches);
      }
    }

    // Cache the results
    if (allMatches.length > 0) {
      await this.cacheMatches(date, allMatches);
    }

    // Return filtered by requested leagues
    return allMatches.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  private async getCachedMatches(date: string): Promise<RealMatch[] | null> {
    try {
      const supabase = await createClient();

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
      const supabase = await createClient();
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours

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

  // Generate sample matches for leagues not covered by APIs
  private generateSampleMatches(
    date: string,
    leagueCode: string,
    leagueInfo: { name: string; country: string }
  ): RealMatch[] {
    // Only generate for certain days (weekend/Wednesday typically have more matches)
    const dayOfWeek = new Date(date).getDay();
    const isMatchDay = [0, 3, 6].includes(dayOfWeek); // Sunday, Wednesday, Saturday

    if (!isMatchDay) return [];

    // Sample teams for African leagues
    const teamsByLeague: Record<string, string[]> = {
      BJ1: ['Dragons FC', 'ASPAC Cotonou', 'Requins AC', 'Buffles du Borgou', 'Dadje FC', 'Dynamo Parakou'],
      CI1: ['ASEC Mimosas', 'Africa Sports', 'Stade d\'Abidjan', 'Séwé Sport', 'Sol FC', 'Racing Club'],
      SN1: ['ASC Jaraaf', 'Génération Foot', 'Diambars', 'Casa Sports', 'AS Douanes', 'Niary Tally'],
      CM1: ['Canon Yaoundé', 'Cotonsport Garoua', 'Coton Sport', 'UMS de Loum', 'Bamboutos FC'],
      NG1: ['Enyimba FC', 'Kano Pillars', 'Rangers Int\'l', 'Akwa United', 'Plateau United'],
      GH1: ['Hearts of Oak', 'Asante Kotoko', 'Aduana Stars', 'Medeama SC', 'Legon Cities'],
      CAN: ['Cameroun', 'Sénégal', 'Maroc', 'Nigeria', 'Côte d\'Ivoire', 'Égypte', 'Algérie', 'Ghana'],
    };

    const teams = teamsByLeague[leagueCode] || ['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D'];

    const matches: RealMatch[] = [];
    const times = ['14:00', '16:00', '18:00', '20:00'];

    // Generate 2-4 matches
    const numMatches = Math.min(Math.floor(teams.length / 2), 4);

    for (let i = 0; i < numMatches; i++) {
      const homeTeam = teams[i * 2];
      const awayTeam = teams[i * 2 + 1];
      if (!homeTeam || !awayTeam) break;

      matches.push({
        id: `sample-${leagueCode}-${date}-${i}`,
        homeTeam,
        awayTeam,
        league: leagueInfo.name,
        leagueCode,
        country: leagueInfo.country,
        date,
        time: times[i % times.length],
        status: 'scheduled',
        odds: this.generateRealisticOdds(),
      });
    }

    return matches;
  }

  private mapStatus(status?: string): 'scheduled' | 'live' | 'finished' {
    if (!status) return 'scheduled';
    const lower = status.toLowerCase();
    if (lower.includes('finish') || lower.includes('ft')) return 'finished';
    if (lower.includes('live') || lower.includes('progress')) return 'live';
    return 'scheduled';
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
      39: 'PL',   // Premier League
      140: 'LA',  // La Liga
      135: 'SA',  // Serie A
      78: 'BL',   // Bundesliga
      61: 'FL',   // Ligue 1
      2: 'CL',    // Champions League
      3: 'EL',    // Europa League
      94: 'PT1',  // Primeira Liga
      88: 'NL1',  // Eredivisie
      144: 'BE1', // Pro League
      71: 'BR1',  // Brasileirão
      262: 'MX1', // Liga MX
      253: 'US1', // MLS
      233: 'EG1', // Egyptian Premier
      200: 'TR1', // Super Lig
      307: 'SA1', // Saudi Pro League
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
