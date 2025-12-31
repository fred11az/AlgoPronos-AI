// Football-Data.org API service (FREE tier)
// Documentation: https://www.football-data.org/documentation/api

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

// Football-Data.org competition codes (free tier)
const competitionMap: Record<string, string> = {
  // Available in free tier
  PL: 'PL',      // Premier League
  LA: 'PD',      // La Liga (Primera Division)
  SA: 'SA',      // Serie A
  BL: 'BL1',     // Bundesliga
  FL: 'FL1',     // Ligue 1
  CL: 'CL',      // Champions League
  EL: 'EL',      // Europa League
  // Other available competitions
  PT1: 'PPL',    // Primeira Liga
  NL1: 'DED',    // Eredivisie
  BR1: 'BSA',    // Brasileirão
};

// Countries for each league
const leagueCountries: Record<string, string> = {
  PL: 'Angleterre',
  LA: 'Espagne',
  SA: 'Italie',
  BL: 'Allemagne',
  FL: 'France',
  CL: 'Europe',
  EL: 'Europe',
  PT1: 'Portugal',
  NL1: 'Pays-Bas',
  BR1: 'Brésil',
};

const leagueNames: Record<string, string> = {
  PL: 'Premier League',
  LA: 'La Liga',
  SA: 'Serie A',
  BL: 'Bundesliga',
  FL: 'Ligue 1',
  CL: 'Champions League',
  EL: 'Europa League',
  PT1: 'Primeira Liga',
  NL1: 'Eredivisie',
  BR1: 'Brasileirão',
};

class FootballDataService {
  private baseUrl = 'https://api.football-data.org/v4';

  private getApiKey(): string {
    return process.env.FOOTBALL_DATA_API_KEY || '';
  }

  private async fetch(endpoint: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('Football-Data.org API key not configured');
      return null;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Fetching Football-Data.org: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limited by Football-Data.org');
        throw new Error('Rate limited');
      }
      const text = await response.text();
      console.error(`Football-Data.org error: ${response.status} - ${text}`);
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async getMatchesByDate(date: string, leagueCodes: string[]): Promise<FootballMatch[]> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.log('No Football-Data.org API key, using mock data');
      return this.getMockMatches(date, leagueCodes);
    }

    // Filter to only supported competitions
    const supportedLeagues = leagueCodes.filter(code => competitionMap[code]);

    if (supportedLeagues.length === 0) {
      console.log('No supported leagues selected, using mock for African leagues');
      return this.getMockMatches(date, leagueCodes);
    }

    try {
      // Fetch matches for each supported competition
      const competitionCodes = supportedLeagues.map(code => competitionMap[code]).filter(Boolean);

      console.log(`Fetching matches for competitions: ${competitionCodes.join(', ')}`);

      const matchPromises = competitionCodes.map(async (compCode) => {
        try {
          const data = await this.fetch(`/competitions/${compCode}/matches?dateFrom=${date}&dateTo=${date}`);
          return data?.matches || [];
        } catch (err) {
          console.error(`Error fetching competition ${compCode}:`, err);
          return [];
        }
      });

      const results = await Promise.all(matchPromises);
      const allApiMatches = results.flat();

      if (!allApiMatches || allApiMatches.length === 0) {
        console.log('No matches returned from API for selected leagues');
        return this.getMockMatches(date, leagueCodes);
      }

      const matches: FootballMatch[] = [];

      for (const match of allApiMatches) {
        // Find our league code from competition code
        const leagueCode = Object.entries(competitionMap).find(
          ([, apiCode]) => apiCode === match.competition.code
        )?.[0];

        // Only include if it's in our selected leagues
        if (leagueCode && leagueCodes.includes(leagueCode)) {
          matches.push({
            id: match.id.toString(),
            homeTeam: match.homeTeam.shortName || match.homeTeam.name,
            awayTeam: match.awayTeam.shortName || match.awayTeam.name,
            homeLogo: match.homeTeam.crest,
            awayLogo: match.awayTeam.crest,
            league: leagueNames[leagueCode] || match.competition.name,
            leagueCode: leagueCode,
            leagueLogo: match.competition.emblem,
            country: leagueCountries[leagueCode] || match.area.name,
            date: match.utcDate.split('T')[0],
            time: new Date(match.utcDate).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Africa/Porto-Novo',
            }),
            status: this.mapStatus(match.status),
            homeScore: match.score?.fullTime?.home,
            awayScore: match.score?.fullTime?.away,
            // Generate realistic odds based on match data
            odds: this.generateOdds(match),
          });
        }
      }

      // Add mock data for unsupported leagues (African, etc.)
      const unsupportedLeagues = leagueCodes.filter(code => !competitionMap[code]);
      if (unsupportedLeagues.length > 0) {
        const mockMatches = this.getMockMatches(date, unsupportedLeagues);
        matches.push(...mockMatches);
      }

      // Sort by time
      matches.sort((a, b) => a.time.localeCompare(b.time));

      console.log(`Found ${matches.length} matches for ${date}`);
      return matches;

    } catch (error) {
      console.error('Error fetching from Football-Data.org:', error);
      return this.getMockMatches(date, leagueCodes);
    }
  }

  private mapStatus(status: string): 'scheduled' | 'live' | 'finished' {
    switch (status) {
      case 'SCHEDULED':
      case 'TIMED':
        return 'scheduled';
      case 'IN_PLAY':
      case 'PAUSED':
      case 'LIVE':
        return 'live';
      case 'FINISHED':
      case 'AWARDED':
        return 'finished';
      default:
        return 'scheduled';
    }
  }

  private generateOdds(match: any): { home: number; draw: number; away: number } {
    // Generate realistic odds - in production, you'd get these from a betting API
    // For now, we'll create plausible odds
    const baseHome = 1.5 + Math.random() * 2;
    const baseDraw = 2.8 + Math.random() * 1.5;
    const baseAway = 2 + Math.random() * 3;

    return {
      home: Math.round(baseHome * 100) / 100,
      draw: Math.round(baseDraw * 100) / 100,
      away: Math.round(baseAway * 100) / 100,
    };
  }

  // Mock data for leagues not covered by free API (African leagues, etc.)
  private getMockMatches(date: string, leagueCodes: string[]): FootballMatch[] {
    const mockTeams: Record<string, { home: string[]; away: string[]; league: string; country: string }> = {
      // African leagues - mock data
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
      GH1: {
        home: ['Hearts of Oak', 'Asante Kotoko', 'Medeama SC', 'Aduana Stars'],
        away: ['Dreams FC', 'Legon Cities', 'Berekum Chelsea', 'Karela United'],
        league: 'GPL Ghana',
        country: 'Ghana',
      },
      // European fallbacks if API fails
      PL: {
        home: ['Manchester City', 'Liverpool', 'Arsenal', 'Chelsea'],
        away: ['Newcastle', 'Brighton', 'Aston Villa', 'West Ham'],
        league: 'Premier League',
        country: 'Angleterre',
      },
      LA: {
        home: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla'],
        away: ['Valencia', 'Villarreal', 'Athletic Bilbao', 'Real Sociedad'],
        league: 'La Liga',
        country: 'Espagne',
      },
    };

    const matches: FootballMatch[] = [];
    let matchId = 10000 + Math.floor(Math.random() * 1000);

    for (const code of leagueCodes) {
      const leagueData = mockTeams[code];
      if (!leagueData) continue;

      // Generate 2-3 matches per league for the selected date
      const matchCount = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < matchCount && i < leagueData.home.length; i++) {
        const hour = 15 + Math.floor(Math.random() * 6); // Between 15:00 and 20:00
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

    return matches;
  }
}

export const footballDataService = new FootballDataService();
