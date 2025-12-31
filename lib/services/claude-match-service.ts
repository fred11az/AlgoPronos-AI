// Claude-powered match search service
// Claude searches the web for ALL matches of the day and caches them in Supabase for 24h

import Anthropic from '@anthropic-ai/sdk';
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

// All supported leagues with their info
const allLeagues: Record<string, { name: string; country: string }> = {
  // Europe Top 5
  PL: { name: 'Premier League', country: 'Angleterre' },
  LA: { name: 'La Liga', country: 'Espagne' },
  SA: { name: 'Serie A', country: 'Italie' },
  BL: { name: 'Bundesliga', country: 'Allemagne' },
  FL: { name: 'Ligue 1', country: 'France' },
  // European competitions
  CL: { name: 'Champions League', country: 'Europe' },
  EL: { name: 'Europa League', country: 'Europe' },
  ECL: { name: 'Conference League', country: 'Europe' },
  // Africa
  CAN: { name: 'Coupe d\'Afrique des Nations', country: 'Afrique' },
  CAF_CL: { name: 'Ligue des Champions CAF', country: 'Afrique' },
  CAF_CC: { name: 'Coupe de la Confédération CAF', country: 'Afrique' },
  BJ1: { name: 'Ligue Pro Bénin', country: 'Bénin' },
  CI1: { name: 'Ligue 1 Ivoirienne', country: 'Côte d\'Ivoire' },
  SN1: { name: 'Ligue 1 Sénégalaise', country: 'Sénégal' },
  CM1: { name: 'Elite One', country: 'Cameroun' },
  NG1: { name: 'NPFL Nigeria', country: 'Nigeria' },
  GH1: { name: 'Ghana Premier League', country: 'Ghana' },
  EG1: { name: 'Egyptian Premier League', country: 'Égypte' },
  MA1: { name: 'Botola Pro', country: 'Maroc' },
  TN1: { name: 'Ligue 1 Tunisie', country: 'Tunisie' },
  DZ1: { name: 'Ligue 1 Algérie', country: 'Algérie' },
  // Other Europe
  PT1: { name: 'Primeira Liga', country: 'Portugal' },
  NL1: { name: 'Eredivisie', country: 'Pays-Bas' },
  BE1: { name: 'Pro League', country: 'Belgique' },
  TR1: { name: 'Süper Lig', country: 'Turquie' },
  GR1: { name: 'Super League', country: 'Grèce' },
  CH1: { name: 'Super League', country: 'Suisse' },
  AT1: { name: 'Bundesliga', country: 'Autriche' },
  SC1: { name: 'Premiership', country: 'Écosse' },
  // Americas
  BR1: { name: 'Brasileirão', country: 'Brésil' },
  AR1: { name: 'Liga Profesional', country: 'Argentine' },
  MX1: { name: 'Liga MX', country: 'Mexique' },
  US1: { name: 'MLS', country: 'USA' },
  COPA: { name: 'Copa Libertadores', country: 'Amérique du Sud' },
  // Asia
  JP1: { name: 'J-League', country: 'Japon' },
  KR1: { name: 'K-League', country: 'Corée du Sud' },
  SA1: { name: 'Saudi Pro League', country: 'Arabie Saoudite' },
  AU1: { name: 'A-League', country: 'Australie' },
};

class ClaudeMatchService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async getMatchesForDate(date: string, leagueCodes: string[]): Promise<RealMatch[]> {
    // First check cache for the full day
    const cachedMatches = await this.getCachedMatches(date);

    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`Returning ${cachedMatches.length} cached matches for ${date}`);
      // Filter by requested leagues
      return cachedMatches.filter(m => leagueCodes.includes(m.leagueCode));
    }

    // Search for ALL matches of the day using Claude
    console.log(`Searching all matches for ${date} with Claude...`);
    const allMatches = await this.searchAllMatchesWithClaude(date);

    // Cache ALL matches for 24 hours
    if (allMatches.length > 0) {
      await this.cacheMatches(date, allMatches);
    }

    // Return only the requested leagues
    return allMatches.filter(m => leagueCodes.includes(m.leagueCode));
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

      if (error || !data) {
        return null;
      }

      return data.matches as RealMatch[];
    } catch {
      return null;
    }
  }

  private async cacheMatches(date: string, matches: RealMatch[]): Promise<void> {
    try {
      const supabase = await createClient();

      // Cache for 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Delete old cache for this date
      await supabase
        .from('matches_cache')
        .delete()
        .eq('date', date);

      // Insert new cache
      await supabase
        .from('matches_cache')
        .insert({
          date,
          leagues: Object.keys(allLeagues),
          matches,
          expires_at: expiresAt,
        });

      console.log(`Cached ${matches.length} matches for ${date}`);
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  private async searchAllMatchesWithClaude(date: string): Promise<RealMatch[]> {
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Build list of all leagues to search
    const leaguesList = Object.entries(allLeagues)
      .map(([code, info]) => `- ${info.name} (${info.country}) [code: ${code}]`)
      .join('\n');

    const prompt = `Tu es un expert en football. Recherche TOUS les matchs de football programmés pour le ${formattedDate}.

CHAMPIONNATS À RECHERCHER:
${leaguesList}

INSTRUCTIONS:
1. Recherche les matchs programmés pour EXACTEMENT le ${formattedDate}
2. Inclus l'heure en format HH:MM (heure de Paris/GMT+1)
3. Si un championnat n'a pas de match ce jour, ne l'inclus pas
4. Sois PRÉCIS - ne donne que les vrais matchs confirmés

RÉPONDS UNIQUEMENT avec ce JSON:
{
  "matches": [
    {
      "homeTeam": "Équipe domicile",
      "awayTeam": "Équipe extérieur",
      "time": "20:00",
      "league": "Nom du championnat",
      "leagueCode": "CODE"
    }
  ]
}

Si aucun match n'existe pour cette date: {"matches": []}`;

    try {
      console.log(`Calling Claude to search matches for ${date}...`);

      const message = await this.anthropic.messages.create({
        // Haiku is perfect for simple search tasks - very cheap
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Claude response not in JSON format');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.matches || !Array.isArray(parsed.matches)) {
        return [];
      }

      // Transform to RealMatch format
      const matches: RealMatch[] = parsed.matches.map((m: any, index: number) => {
        const leagueInfo = allLeagues[m.leagueCode];

        return {
          id: `${date}-${m.leagueCode}-${index}-${Date.now()}`,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league || leagueInfo?.name || 'Unknown',
          leagueCode: m.leagueCode,
          country: leagueInfo?.country || 'Unknown',
          date: date,
          time: m.time || '15:00',
          status: 'scheduled' as const,
          odds: this.generateRealisticOdds(),
        };
      });

      console.log(`Claude found ${matches.length} matches for ${date}`);
      return matches;

    } catch (error) {
      console.error('Error searching matches with Claude:', error);
      return [];
    }
  }

  private generateRealisticOdds(): { home: number; draw: number; away: number } {
    // Generate realistic odds
    const homeBase = 1.3 + Math.random() * 2.5;
    const drawBase = 2.8 + Math.random() * 1.5;
    const awayBase = 1.8 + Math.random() * 3.5;

    return {
      home: Math.round(homeBase * 100) / 100,
      draw: Math.round(drawBase * 100) / 100,
      away: Math.round(awayBase * 100) / 100,
    };
  }
}

export const claudeMatchService = new ClaudeMatchService();
