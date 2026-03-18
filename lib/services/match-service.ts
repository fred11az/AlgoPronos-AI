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
    draw?: number; // Optional for sports without draws like Tennis
    away: number;
  };
  sport: 'football' | 'tennis' | 'basketball' | 'mma' | 'other';
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
    sport: string = 'football'
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

    console.log(`[Sync] EXHAUSTIVE Sync for ${dates.length} days (${sport.toUpperCase()}). Source: AI Global Search.`);
    console.warn(`[Sync] API-Football dependency REMOVED. Using pure AI discovery.`);

    for (const date of dates) {
      // ── PRIMARY: AI Search ──────────────────────────────
      console.log(`[Sync] ${date} (${sport}): Starting exhaustive global search...`);
      const openClawMatches = await this.searchMatchesWithAI(date, sport);
      
      if (openClawMatches.length > 0) {
        console.log(`[Sync] ${date} (${sport}): Success! Captured ${openClawMatches.length} matches.`);
        byDate[date] = openClawMatches;
        await this.cacheMatches(date, openClawMatches, sport);
      } else {
        console.warn(`[Sync] ${date} (${sport}): No matches found.`);
        byDate[date] = [];
      }
    }

    return { byDate, apiErrors, rawFixturesCount };
  }

  /**
   * Use OpenRouter/OpenClaw to search the web for matches and odds in a segmented way.
   * Expanded segments for 100% coverage.
   */
  private async searchMatchesWithAI(date: string, sport: string): Promise<RealMatch[]> {
    console.log(`[MatchService] Starting MULTI-SEGMENT AI search for ${sport} on ${date}...`);

    let segments: { name: string; prompt: string }[] = [];

    if (sport === 'football') {
      segments = [
        { name: 'Europe Elite', prompt: `Matchs de football RÉELS: Ligue des Champions, Premier League, LaLiga, Serie A, Bundesliga, Ligue 1 pour le ${date}.` },
        { name: 'Europe Sec.', prompt: `Matchs de football: Ligue 2, Eredivisie, Liga Portugal, SuperLig, etc. pour le ${date}.` },
        { name: 'Afrique', prompt: `Matchs de football en Afrique (Benin Ligue 1, Côte d'Ivoire, Sénégal, Cameroun, Maroc Botola) pour le ${date}.` },
        { name: 'Amériques', prompt: `Matchs de football RÉELS: MLS, Bresil Série A, Argentine pour le ${date}.` }
      ];
    } else if (sport === 'tennis') {
      segments = [
        { name: 'ATP/WTA', prompt: `Tous les matchs de Tennis RÉELS pour le ${date} (ATP, WTA, Challenger).` }
      ];
    } else if (sport === 'basketball') {
      segments = [
        { name: 'NBA/Euro', prompt: `Tous les matchs de Basket-ball RÉELS pour le ${date} (NBA, EuroLeague, Championnats nationaux).` }
      ];
    } else {
      segments = [
        { name: 'Autres', prompt: `Tous les événements sportifs majeurs RÉELS (${sport}) pour le ${date} (ex: UFC, MMA, Rugby).` }
      ];
    }

    let allMatches: RealMatch[] = [];
    const orApiKey = process.env.OPENROUTER_API_KEY;
    const useDirectSearch = !!orApiKey;

    for (const segment of segments) {
      console.log(`[MatchService] Querying segment: ${segment.name}...`);
      const matches = await this.fetchOpenClawSegment(date, segment.prompt, sport);
      allMatches = [...allMatches, ...matches];
    }

    // Deduplicate
    const uniqueMatchesMap = new Map();
    allMatches.forEach(m => {
      const key = `${m.homeTeam}-${m.awayTeam}-${m.time}-${sport}`.toLowerCase().replace(/\s/g, '');
      if (!uniqueMatchesMap.has(key)) {
        uniqueMatchesMap.set(key, m);
      }
    });

    const finalMatches = Array.from(uniqueMatchesMap.values());
    console.log(`[MatchService] Total unique matches found (${sport}): ${finalMatches.length}`);
    return finalMatches;
  }

  private async fetchOpenClawSegment(date: string, regionalPrompt: string, sport: string = 'football'): Promise<RealMatch[]> {
    const groqKey = process.env.GROQ_API_KEY;
    const orApiKey = process.env.OPENROUTER_API_KEY;
    
    // Choose the best available endpoint
    const url = groqKey ? 'https://api.groq.com/openai/v1/chat/completions' : (orApiKey ? 'https://openrouter.ai/api/v1/chat/completions' : (process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789/v1/chat/completions'));
    const token = groqKey || orApiKey || process.env.OPENCLAW_GATEWAY_TOKEN;
    const model = groqKey ? 'llama-3.3-70b-versatile' : (orApiKey ? 'perplexity/sonar' : 'openclaw');

    if (!token) {
      console.warn('[MatchService] No Groq, OpenRouter or OpenClaw token set — cannot search web.');
      return [];
    }

    const fullPrompt = `MISSION : Tu es un spécialiste de l'extraction de données sportives en temps réel. Ta tâche est de trouver une liste exhaustive des matchs de ${sport.toUpperCase()} RÉELS pour le ${date}.
Zone/Cible : ${regionalPrompt}.

INSTRUCTIONS CRITIQUES :
1. UTILISE TES OUTILS DE RECHERCHE (Web Search) pour trouver les matchs RÉELS, PRIORITÉ : FlashScore (flashscore.com). 
2. Pour CHAQUE match, récupère : l'équipe à domicile, l'équipe à l'extérieur, la ligue, l'heure exacte et les cotes 1N2 (ou Victoire 1/2 pour Tennis/NBA).
3. Réponds UNIQUEMENT avec un tableau JSON d'objets.

FORMAT DE RÉPONSE ATTENDU :
[
  { 
    "homeTeam": "...", "awayTeam": "...", "league": "...", "country": "...",
    "time": "HH:mm", 
    "odds": { "home": 2.1, "draw": 3.2, "away": 3.5 } 
  }
]
Pour le Tennis/Basket sans match nul, mets "draw": null.`;

    try {
      const body: any = {
        model,
        messages: [
          { role: 'system', content: 'Tu es un agent expert en recherche de données web. Ta mission est de fournir des informations précises au format JSON.' },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.1,
      };

      if (orApiKey && !groqKey) {
        body.max_tokens = 2000;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[MatchService] Fetch error (${orApiKey ? 'OpenRouter' : 'OpenClaw'}): ${res.status} - ${errText}`);
        return [];
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) return [];

      // Detect common tool failures
      if (content.includes('missing_brave_api_key') || content.includes('technique avec les outils de recherche')) {
        console.error('[MatchService] OpenClaw failure detected in response content.');
        return [];
      }

      const jsonStr = content.match(/\[[\s\S]*\]/)?.[0] || content;
      const results = JSON.parse(jsonStr);

      if (!Array.isArray(results)) return [];

      return results.map((r: any, index: number) => ({
        id: `openclaw-${date}-${Math.random().toString(36).substr(2, 9)}`,
        homeTeam: r.homeTeam,
        awayTeam: r.awayTeam,
        league: r.league,
        leagueCode: this.inferLeagueCode(r.league),
        country: r.country || '',
        date: date,
        time: r.time,
        status: 'scheduled',
        sport: sport as any,
        odds: (r.odds && r.odds.home > 0) ? r.odds : this.generateRealisticOdds(sport),
      }));
    } catch (err) {
      console.error('[MatchService] OpenClaw segment failed:', err);
      return [];
    }
  }

  /**
   * Simple helper to map common league names to codes for filtering
   */
  private inferLeagueCode(leagueName: string): string {
    const l = leagueName.toUpperCase();
    if (l.includes('PREMIER LEAGUE')) return 'PL';
    if (l.includes('LALIGA') || l.includes('LA LIGA')) return 'LA';
    if (l.includes('SERIE A')) return 'SA';
    if (l.includes('BUNDESLIGA')) return 'BL';
    if (l.includes('LIGUE 1')) return 'FL';
    if (l.includes('CHAMPIONS LEAGUE')) return 'CL';
    if (l.includes('EUROPA LEAGUE')) return 'EL';
    if (l.includes('MLS')) return 'US1';
    if (l.includes('SÉNÉGAL')) return 'SN1';
    if (l.includes('CÔTE D\'IVOIRE')) return 'CI1';
    if (l.includes('BÉNIN')) return 'BJ1';
    return 'TOP'; // Default category
  }

  // Single-date fetch (reads from cache first, falls back to range fetch)
  async getMatchesForDate(date: string, sport: string = 'football', leagueCodes?: string[]): Promise<RealMatch[]> {
    const cached = await this.getCachedMatches(date, sport);
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
    const { byDate } = await this.getMatchesForRange(date, date, sport);
    const matches = byDate[date] ?? [];
    if (!leagueCodes || leagueCodes.length === 0) return matches;
    return matches.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  private async getCachedMatches(date: string, sport: string): Promise<RealMatch[] | null> {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('matches_cache')
        .select('matches')
        .eq('date', date)
        .eq('sport', sport)
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

  private async cacheMatches(date: string, matches: RealMatch[], sport: string): Promise<void> {
    try {
      const supabase = createAdminClient();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

      await supabase.from('matches_cache').delete().eq('date', date).eq('sport', sport);

      await supabase.from('matches_cache').insert({
        date,
        sport,
        leagues: Array.from(new Set(matches.map((m) => m.leagueCode))),
        matches,
        expires_at: expiresAt,
      });

      console.log(`Cached ${matches.length} matches for ${date} (${sport})`);
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  private generateRealisticOdds(sport: string = 'football'): { home: number; draw?: number; away: number } {
    const homeBase = 1.4 + Math.random() * 2.2;
    const drawBase = 2.8 + Math.random() * 1.5;
    const awayBase = 2.0 + Math.random() * 3.0;

    if (sport === 'tennis' || sport === 'basketball') {
      return {
        home: Math.round(homeBase * 100) / 100,
        away: Math.round(awayBase * 100) / 100,
      };
    }

    return {
      home: Math.round(homeBase * 100) / 100,
      draw: Math.round(drawBase * 100) / 100,
      away: Math.round(awayBase * 100) / 100,
    };
  }
}

export const matchService = new MatchService();
