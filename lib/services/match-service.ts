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
        // Fetch odds for all fixtures in one batch call (bookmaker 8 = Bet365, bet 1 = Match Winner)
        const fixtureIds = data.response
          .map((f: { fixture: { id: number }; league: { id: number } }) =>
            this.mapAPIFootballLeague(f.league.id) ? f.fixture.id : null
          )
          .filter(Boolean)
          .join('-');

        // Try to get odds for all fixtures at once
        let oddsMap: Record<number, { home: number; draw: number; away: number }> = {};
        try {
          const oddsRes = await fetch(
            `https://v3.football.api-sports.io/odds?date=${date}&bookmaker=8&bet=1`,
            { headers: { 'x-apisports-key': apiKey } }
          );
          if (oddsRes.ok) {
            const oddsData = await oddsRes.json();
            for (const item of (oddsData.response ?? [])) {
              const fid: number = item.fixture?.id;
              const values = item.bookmakers?.[0]?.bets?.[0]?.values ?? [];
              const home = values.find((v: { value: string }) => v.value === 'Home')?.odd;
              const draw = values.find((v: { value: string }) => v.value === 'Draw')?.odd;
              const away = values.find((v: { value: string }) => v.value === 'Away')?.odd;
              if (fid && home && draw && away) {
                oddsMap[fid] = {
                  home: parseFloat(home),
                  draw: parseFloat(draw),
                  away: parseFloat(away),
                };
              }
            }
          }
        } catch {
          // Odds fetch failed — fall back to generated odds below
        }

        for (const fixture of data.response) {
          const leagueCode = this.mapAPIFootballLeague(fixture.league.id);
          if (!leagueCode) continue;

          const fid: number = fixture.fixture.id;
          const odds = oddsMap[fid] ?? this.generateRealisticOdds();

          matches.push({
            id: `apif-${fid}`,
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
            odds,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching from API-Football:', error);
    }

    return matches;
  }

  // Main function to get matches - REAL DATA from BOTH APIs combined
  async getMatchesForDate(date: string, leagueCodes: string[]): Promise<RealMatch[]> {
    // Check cache first
    const cachedMatches = await this.getCachedMatches(date);
    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`[CACHE] Returning ${cachedMatches.length} real matches for ${date}`);
      return cachedMatches.filter((m) => leagueCodes.includes(m.leagueCode));
    }

    console.log(`[API] Fetching real matches for ${date} from BOTH APIs...`);

    // Call BOTH APIs in PARALLEL for maximum coverage
    const apiKey = process.env.FOOTBALL_API_KEY;

    const [apiFootballMatches, tsdbMatches] = await Promise.all([
      // API-Football (if key available)
      apiKey
        ? this.fetchFromAPIFootball(date, apiKey)
            .then(matches => {
              console.log(`[API-Football] Found ${matches.length} matches`);
              return matches;
            })
            .catch(err => {
              console.error('[API-Football] Error:', err.message);
              return [] as RealMatch[];
            })
        : Promise.resolve([] as RealMatch[]),

      // TheSportsDB (always free)
      this.fetchFromTSDB(date)
        .then(matches => {
          console.log(`[TheSportsDB] Found ${matches.length} matches`);
          return matches;
        })
        .catch(err => {
          console.error('[TheSportsDB] Error:', err.message);
          return [] as RealMatch[];
        }),
    ]);

    // Merge results, avoiding duplicates (by team names)
    const allMatches: RealMatch[] = [...apiFootballMatches];
    const existingMatchKeys = new Set(
      apiFootballMatches.map(m => `${m.homeTeam.toLowerCase()}-${m.awayTeam.toLowerCase()}`)
    );

    for (const match of tsdbMatches) {
      const key = `${match.homeTeam.toLowerCase()}-${match.awayTeam.toLowerCase()}`;
      if (!existingMatchKeys.has(key)) {
        allMatches.push(match);
        existingMatchKeys.add(key);
      }
    }

    console.log(`[TOTAL] Combined ${allMatches.length} unique matches from both APIs`);

    // Cache real matches for 6 hours
    if (allMatches.length > 0) {
      await this.cacheMatches(date, allMatches);
      console.log(`[SUCCESS] Cached ${allMatches.length} real matches`);
    } else {
      console.log('[WARNING] No matches found from APIs - check date or network');
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

  // Generate sample matches for leagues (fallback when API unavailable)
  private generateSampleMatches(
    date: string,
    leagueCode: string,
    leagueInfo: { name: string; country: string }
  ): RealMatch[] {
    // Real teams for all major leagues
    const teamsByLeague: Record<string, string[]> = {
      // Europe Top 5
      PL: ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham'],
      LA: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Athletic Bilbao', 'Villarreal', 'Real Betis', 'Valencia', 'Girona'],
      SA: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino'],
      BL: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Union Berlin', 'Freiburg', 'Eintracht Frankfurt', 'Wolfsburg', 'Mainz', 'Hoffenheim'],
      FL: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Nice', 'Rennes', 'Lens', 'Strasbourg', 'Nantes'],
      // European Competitions
      CL: ['Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG', 'Inter Milan', 'Barcelona', 'Arsenal', 'Napoli'],
      EL: ['Liverpool', 'Roma', 'Leverkusen', 'West Ham', 'Atalanta', 'Marseille', 'Ajax', 'Freiburg'],
      // Other Europe
      PT1: ['Benfica', 'Porto', 'Sporting CP', 'Braga', 'Vitória Guimarães', 'Boavista'],
      NL1: ['Ajax', 'PSV', 'Feyenoord', 'AZ Alkmaar', 'Twente', 'Utrecht'],
      BE1: ['Club Brugge', 'Union SG', 'Genk', 'Antwerp', 'Anderlecht', 'Standard'],
      TR1: ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'Başakşehir', 'Konyaspor'],
      // Africa
      BJ1: ['Dragons FC', 'ASPAC Cotonou', 'Requins AC', 'Buffles du Borgou', 'Dadje FC', 'Dynamo Parakou'],
      CI1: ['ASEC Mimosas', 'Africa Sports', 'Stade d\'Abidjan', 'Séwé Sport', 'Sol FC', 'Racing Club'],
      SN1: ['ASC Jaraaf', 'Génération Foot', 'Diambars', 'Casa Sports', 'AS Douanes', 'Niary Tally'],
      CM1: ['Canon Yaoundé', 'Cotonsport Garoua', 'Coton Sport', 'UMS de Loum', 'Bamboutos FC', 'PWD Bamenda'],
      NG1: ['Enyimba FC', 'Kano Pillars', 'Rangers Int\'l', 'Akwa United', 'Plateau United', 'Rivers United'],
      GH1: ['Hearts of Oak', 'Asante Kotoko', 'Aduana Stars', 'Medeama SC', 'Legon Cities', 'Great Olympics'],
      EG1: ['Al Ahly', 'Zamalek', 'Pyramids FC', 'Al Masry', 'Ismaily', 'Enppi'],
      MA1: ['Wydad Casablanca', 'Raja Casablanca', 'AS FAR', 'RS Berkane', 'FUS Rabat', 'Maghreb Fès'],
      TN1: ['Espérance Tunis', 'Étoile du Sahel', 'Club Africain', 'CS Sfaxien', 'US Monastir', 'CA Bizertin'],
      DZ1: ['USM Alger', 'MC Alger', 'JS Kabylie', 'CR Belouizdad', 'ES Sétif', 'CS Constantine'],
      // CAN International
      CAN: ['Cameroun', 'Sénégal', 'Maroc', 'Nigeria', 'Côte d\'Ivoire', 'Égypte', 'Algérie', 'Ghana'],
      // Americas
      BR1: ['Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Fluminense', 'Atlético Mineiro'],
      AR1: ['Boca Juniors', 'River Plate', 'Racing Club', 'Independiente', 'San Lorenzo', 'Estudiantes'],
      MX1: ['Club América', 'Guadalajara', 'Cruz Azul', 'Tigres UANL', 'Monterrey', 'Pumas UNAM'],
      US1: ['LA Galaxy', 'LAFC', 'Inter Miami', 'Atlanta United', 'Seattle Sounders', 'NYCFC'],
      // Asia
      SA1: ['Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli', 'Al-Shabab', 'Al-Fateh'],
      JP1: ['Vissel Kobe', 'Yokohama F. Marinos', 'Kawasaki Frontale', 'Urawa Red Diamonds', 'FC Tokyo', 'Kashima Antlers'],
    };

    const teams = teamsByLeague[leagueCode] || ['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D'];

    const matches: RealMatch[] = [];
    const times = ['14:00', '16:00', '17:00', '18:30', '20:00', '21:00'];

    // Use date-based seed for consistent but varied match selection
    const dateSeed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);

    // Generate 3-5 matches per league
    const numMatches = Math.min(Math.floor(teams.length / 2), 5);

    for (let i = 0; i < numMatches; i++) {
      // Shuffle team indices based on date for variety
      const idx1 = (i * 2 + dateSeed) % teams.length;
      const idx2 = (i * 2 + 1 + dateSeed) % teams.length;
      const homeTeam = teams[idx1];
      const awayTeam = teams[idx2 === idx1 ? (idx2 + 1) % teams.length : idx2];

      if (!homeTeam || !awayTeam || homeTeam === awayTeam) continue;

      matches.push({
        id: `match-${leagueCode}-${date}-${i}`,
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
