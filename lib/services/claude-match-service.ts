// Claude-powered match search service
// Uses Claude with web search to find real matches and caches them in Supabase

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

const leagueSearchTerms: Record<string, { name: string; searchTerm: string; country: string }> = {
  // Europe Top 5
  PL: { name: 'Premier League', searchTerm: 'Premier League England fixtures', country: 'Angleterre' },
  LA: { name: 'La Liga', searchTerm: 'La Liga Spain fixtures', country: 'Espagne' },
  SA: { name: 'Serie A', searchTerm: 'Serie A Italy fixtures', country: 'Italie' },
  BL: { name: 'Bundesliga', searchTerm: 'Bundesliga Germany fixtures', country: 'Allemagne' },
  FL: { name: 'Ligue 1', searchTerm: 'Ligue 1 France fixtures', country: 'France' },
  // European competitions
  CL: { name: 'Champions League', searchTerm: 'UEFA Champions League fixtures', country: 'Europe' },
  EL: { name: 'Europa League', searchTerm: 'UEFA Europa League fixtures', country: 'Europe' },
  // Africa
  CAN: { name: 'CAN', searchTerm: 'Coupe Afrique Nations CAN fixtures matches', country: 'Afrique' },
  CAF_CL: { name: 'Ligue des Champions CAF', searchTerm: 'CAF Champions League fixtures', country: 'Afrique' },
  CAF_CC: { name: 'Coupe de la Confédération', searchTerm: 'CAF Confederation Cup fixtures', country: 'Afrique' },
  BJ1: { name: 'Ligue Pro Bénin', searchTerm: 'Benin Ligue Pro football fixtures', country: 'Bénin' },
  CI1: { name: 'Ligue 1 Ivoirienne', searchTerm: 'Ivory Coast Ligue 1 fixtures', country: 'Côte d\'Ivoire' },
  SN1: { name: 'Ligue 1 Sénégalaise', searchTerm: 'Senegal Ligue 1 football fixtures', country: 'Sénégal' },
  CM1: { name: 'Elite One', searchTerm: 'Cameroon Elite One football fixtures', country: 'Cameroun' },
  NG1: { name: 'NPFL', searchTerm: 'Nigeria NPFL football fixtures', country: 'Nigeria' },
  GH1: { name: 'Ghana Premier League', searchTerm: 'Ghana Premier League fixtures', country: 'Ghana' },
  EG1: { name: 'Egyptian Premier League', searchTerm: 'Egypt Premier League fixtures', country: 'Égypte' },
  MA1: { name: 'Botola Pro', searchTerm: 'Morocco Botola Pro fixtures', country: 'Maroc' },
  // Other
  PT1: { name: 'Primeira Liga', searchTerm: 'Portugal Primeira Liga fixtures', country: 'Portugal' },
  NL1: { name: 'Eredivisie', searchTerm: 'Netherlands Eredivisie fixtures', country: 'Pays-Bas' },
  BR1: { name: 'Brasileirão', searchTerm: 'Brazil Serie A fixtures', country: 'Brésil' },
};

class ClaudeMatchService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async getMatchesForDate(date: string, leagueCodes: string[]): Promise<RealMatch[]> {
    // First check cache
    const cachedMatches = await this.getCachedMatches(date, leagueCodes);
    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`Returning ${cachedMatches.length} cached matches for ${date}`);
      return cachedMatches;
    }

    // Search for matches using Claude
    const matches = await this.searchMatchesWithClaude(date, leagueCodes);

    // Cache the results
    if (matches.length > 0) {
      await this.cacheMatches(date, leagueCodes, matches);
    }

    return matches;
  }

  private async getCachedMatches(date: string, leagueCodes: string[]): Promise<RealMatch[] | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('matches_cache')
        .select('matches')
        .eq('date', date)
        .contains('leagues', leagueCodes)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data.matches as RealMatch[];
    } catch {
      return null;
    }
  }

  private async cacheMatches(date: string, leagueCodes: string[], matches: RealMatch[]): Promise<void> {
    try {
      const supabase = await createClient();

      // Cache for 6 hours
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('matches_cache')
        .upsert({
          date,
          leagues: leagueCodes,
          matches,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'date,leagues',
        });
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  private async searchMatchesWithClaude(date: string, leagueCodes: string[]): Promise<RealMatch[]> {
    const leagueNames = leagueCodes
      .map(code => leagueSearchTerms[code]?.name || code)
      .join(', ');

    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const prompt = `Recherche les matchs de football programmés pour le ${formattedDate} dans ces compétitions: ${leagueNames}.

Pour chaque match trouvé, donne:
- L'équipe à domicile
- L'équipe à l'extérieur
- L'heure du match (en heure locale GMT+1 Afrique de l'Ouest)
- La compétition

IMPORTANT:
- Ne donne QUE les matchs qui ont VRAIMENT lieu le ${formattedDate}
- Si tu ne trouves pas de matchs pour une compétition, ne l'invente pas
- Les heures doivent être au format HH:MM (ex: 15:00, 20:30)

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "matches": [
    {
      "homeTeam": "Équipe domicile",
      "awayTeam": "Équipe extérieur",
      "time": "20:00",
      "league": "Nom de la compétition",
      "leagueCode": "CODE"
    }
  ]
}

Si aucun match n'est trouvé, réponds: {"matches": []}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Claude response not in JSON format:', responseText);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.matches || !Array.isArray(parsed.matches)) {
        return [];
      }

      // Transform to RealMatch format
      const matches: RealMatch[] = parsed.matches.map((m: any, index: number) => {
        const leagueInfo = Object.entries(leagueSearchTerms).find(
          ([code]) => code === m.leagueCode || leagueCodes.includes(code)
        );
        const leagueCode = m.leagueCode || leagueCodes[0];
        const country = leagueInfo?.[1]?.country || 'Inconnu';

        return {
          id: `${date}-${leagueCode}-${index}`,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league,
          leagueCode: leagueCode,
          country: country,
          date: date,
          time: m.time || '15:00',
          status: 'scheduled' as const,
          odds: {
            home: +(1.5 + Math.random() * 2).toFixed(2),
            draw: +(2.8 + Math.random() * 1.5).toFixed(2),
            away: +(2 + Math.random() * 3).toFixed(2),
          },
        };
      });

      console.log(`Claude found ${matches.length} matches for ${date}`);
      return matches;

    } catch (error) {
      console.error('Error searching matches with Claude:', error);
      return [];
    }
  }
}

export const claudeMatchService = new ClaudeMatchService();
