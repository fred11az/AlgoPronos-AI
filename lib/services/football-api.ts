// Football API service for fetching real matches
// Supports multiple API providers (api-football.com, football-data.org)

export interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  leagueCode: string;
  leagueLogo?: string;
  country: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

// League code mapping to API-Football league IDs
const leagueIdMap: Record<string, number> = {
  // Europe Top 5
  PL: 39,   // Premier League
  LA: 140,  // La Liga
  SA: 135,  // Serie A
  BL: 78,   // Bundesliga
  FL: 61,   // Ligue 1
  // European Competitions
  CL: 2,    // Champions League
  EL: 3,    // Europa League
  ECL: 848, // Conference League
  // Africa
  CAN: 6,   // Africa Cup of Nations
  CAF_CL: 12, // CAF Champions League
  CAF_CC: 20, // CAF Confederation Cup
  EG1: 233, // Egyptian Premier
  MA1: 200, // Botola Pro
  TN1: 202, // Ligue 1 Tunisia
  DZ1: 186, // Ligue 1 Algeria
  NG1: 169, // NPFL Nigeria
  GH1: 520, // Ghana Premier League
  // Other Europe
  PT1: 94,  // Primeira Liga
  NL1: 88,  // Eredivisie
  BE1: 144, // Pro League
  TR1: 203, // Super Lig
  GR1: 197, // Super League Greece
  CH1: 207, // Swiss Super League
  AT1: 218, // Austrian Bundesliga
  SC1: 179, // Scottish Premiership
  // Americas
  BR1: 71,  // Brasileirao
  AR1: 128, // Liga Profesional
  MX1: 262, // Liga MX
  US1: 253, // MLS
  COPA: 13, // Copa Libertadores
  // Asia
  JP1: 98,  // J-League
  KR1: 292, // K-League
  CN1: 169, // Chinese Super League
  AU1: 188, // A-League
  SA1: 307, // Saudi Pro League
  AFC_CL: 17, // AFC Champions League
};

class FootballApiService {
  private baseUrl = 'https://v3.football.api-sports.io';

  private getApiKey(): string {
    return process.env.FOOTBALL_API_KEY || '';
  }

  private async fetch(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('Football API key not configured, using mock data');
      return null;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
      cache: 'no-store', // Don't cache to ensure fresh data
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Football API error: ${response.status} - ${text}`);
      throw new Error(`Football API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API Response for ${endpoint}:`, data.results, 'results');
    return data;
  }

  async getMatchesByDate(date: string, leagueCodes: string[]): Promise<FootballMatch[]> {
    const apiKey = this.getApiKey();

    // If no API key, return mock data
    if (!apiKey) {
      console.log('No API key, using mock data');
      return this.getMockMatches(date, leagueCodes);
    }

    const leagueIds = leagueCodes
      .map(code => leagueIdMap[code])
      .filter(Boolean);

    if (leagueIds.length === 0) {
      return [];
    }

    // Get current season (use current year, or previous year if we're in early months)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed
    // Most European leagues run Aug-May, so use previous year's season if before August
    const season = currentMonth < 8 ? currentYear - 1 : currentYear;

    try {
      // Fetch matches for each league
      const matchPromises = leagueIds.map(leagueId =>
        this.fetch('/fixtures', {
          date,
          league: leagueId.toString(),
          season: season.toString(),
          timezone: 'Africa/Porto-Novo', // West Africa timezone
        }).catch(err => {
          console.error(`Error fetching league ${leagueId}:`, err);
          return null;
        })
      );

      const results = await Promise.all(matchPromises);

      const matches: FootballMatch[] = [];

      for (const result of results) {
        if (result?.response && Array.isArray(result.response)) {
          for (const fixture of result.response) {
            matches.push(this.mapFixtureToMatch(fixture));
          }
        }
      }

      // If no matches found from API, return mock data
      if (matches.length === 0) {
        console.log('No matches from API, using mock data');
        return this.getMockMatches(date, leagueCodes);
      }

      // Sort by time
      matches.sort((a, b) => a.time.localeCompare(b.time));

      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return this.getMockMatches(date, leagueCodes);
    }
  }

  private mapFixtureToMatch(fixture: any): FootballMatch {
    const leagueCode = Object.entries(leagueIdMap).find(
      ([, id]) => id === fixture.league.id
    )?.[0] || 'UNKNOWN';

    return {
      id: fixture.fixture.id.toString(),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeLogo: fixture.teams.home.logo,
      awayLogo: fixture.teams.away.logo,
      league: fixture.league.name,
      leagueCode,
      leagueLogo: fixture.league.logo,
      country: fixture.league.country,
      date: fixture.fixture.date.split('T')[0],
      time: new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: this.mapStatus(fixture.fixture.status.short),
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
    };
  }

  private mapStatus(status: string): 'scheduled' | 'live' | 'finished' {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'BT'];
    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

    if (liveStatuses.includes(status)) return 'live';
    if (finishedStatuses.includes(status)) return 'finished';
    return 'scheduled';
  }

  // Mock data for development/demo
  private getMockMatches(date: string, leagueCodes: string[]): FootballMatch[] {
    const mockTeams: Record<string, { home: string[]; away: string[]; league: string; country: string }> = {
      PL: {
        home: ['Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester United', 'Tottenham'],
        away: ['Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Wolves', 'Fulham'],
        league: 'Premier League',
        country: 'Angleterre',
      },
      LA: {
        home: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad'],
        away: ['Valencia', 'Villarreal', 'Athletic Bilbao', 'Real Betis', 'Osasuna'],
        league: 'La Liga',
        country: 'Espagne',
      },
      SA: {
        home: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma'],
        away: ['Lazio', 'Fiorentina', 'Atalanta', 'Bologna', 'Torino'],
        league: 'Serie A',
        country: 'Italie',
      },
      BL: {
        home: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen'],
        away: ['Eintracht Frankfurt', 'Union Berlin', 'Freiburg', 'Wolfsburg'],
        league: 'Bundesliga',
        country: 'Allemagne',
      },
      FL: {
        home: ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille'],
        away: ['Nice', 'Rennes', 'Lens', 'Nantes', 'Strasbourg'],
        league: 'Ligue 1',
        country: 'France',
      },
      CL: {
        home: ['Real Madrid', 'Manchester City', 'Bayern Munich', 'PSG'],
        away: ['Inter Milan', 'Barcelona', 'Arsenal', 'Napoli'],
        league: 'Champions League',
        country: 'Europe',
      },
      BJ1: {
        home: ['ESAE FC', 'Dragons FC', 'Buffles du Borgou', 'Requins de l\'Atlantique'],
        away: ['Coton FC', 'AS Cotonou', 'Panthères', 'Tonnerre FC'],
        league: 'Ligue Pro Bénin',
        country: 'Bénin',
      },
      CI1: {
        home: ['ASEC Mimosas', 'Africa Sports', 'Stade d\'Abidjan', 'Racing Club Abidjan'],
        away: ['FC San Pedro', 'SOL FC', 'Sporting Gagnoa', 'AS Tanda'],
        league: 'Ligue 1 Ivoirienne',
        country: 'Côte d\'Ivoire',
      },
      SN1: {
        home: ['ASC Jaraaf', 'Casa Sports', 'AS Douanes', 'Génération Foot'],
        away: ['Teungueth FC', 'Diambars', 'US Gorée', 'AS Pikine'],
        league: 'Ligue 1 Sénégalaise',
        country: 'Sénégal',
      },
      CM1: {
        home: ['Coton Sport', 'Eding Sport', 'Union Douala', 'PWD Bamenda'],
        away: ['New Stars', 'Fovu Club', 'Aigle Royal', 'Canon Yaoundé'],
        league: 'Elite One',
        country: 'Cameroun',
      },
      NG1: {
        home: ['Enyimba', 'Kano Pillars', 'Rivers United', 'Plateau United'],
        away: ['Akwa United', 'Remo Stars', 'Shooting Stars', 'Kwara United'],
        league: 'NPFL',
        country: 'Nigeria',
      },
    };

    const matches: FootballMatch[] = [];
    let matchId = 1000;

    for (const code of leagueCodes) {
      const leagueData = mockTeams[code];
      if (!leagueData) continue;

      // Generate 2-4 matches per league
      const matchCount = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < matchCount && i < leagueData.home.length; i++) {
        const hour = 14 + Math.floor(Math.random() * 8); // Between 14:00 and 21:00
        const minute = Math.random() > 0.5 ? '00' : '30';

        matches.push({
          id: (matchId++).toString(),
          homeTeam: leagueData.home[i],
          awayTeam: leagueData.away[i % leagueData.away.length],
          league: leagueData.league,
          leagueCode: code,
          country: leagueData.country,
          date,
          time: `${hour}:${minute}`,
          status: 'scheduled',
          odds: {
            home: +(1.5 + Math.random() * 2).toFixed(2),
            draw: +(2.5 + Math.random() * 1.5).toFixed(2),
            away: +(2 + Math.random() * 3).toFixed(2),
          },
        });
      }
    }

    // Sort by time
    matches.sort((a, b) => a.time.localeCompare(b.time));

    return matches;
  }
}

export const footballApi = new FootballApiService();
