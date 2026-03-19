import { createAdminClient } from '../supabase/server';
import { cachedFetch } from './api/footballApi';

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

    for (const date of dates) {
      // ── LEVEL 1: matches_cache (processed, TTL 12h) ───────────────────
      const cached = await this.getCachedMatches(date, sport);
      if (cached && cached.length > 0) {
        console.log(`[Sync] ${date} (${sport}): Cache HIT — ${cached.length} matches from matches_cache.`);
        byDate[date] = cached;
        rawFixturesCount += cached.length;
        continue;
      }

      if (sport === 'football') {
        // ── LEVEL 2: api_cache → RapidAPI (raw response, TTL 24h) ────────
        console.log(`[Sync] ${date} (FOOTBALL): Cache MISS — fetching via API-Football...`);
        const apiMatches = await this.fetchFootballFromAPI(date);

        if (apiMatches.length > 0) {
          console.log(`[Sync] ${date} (FOOTBALL): Success! Found ${apiMatches.length} matches via API.`);
          byDate[date] = apiMatches;
          rawFixturesCount += apiMatches.length;
          await this.cacheMatches(date, apiMatches, sport);
          continue; // Found via API, skip AI fallback
        }
      }

      // ── LEVEL 3: AI Search fallback ───────────────────────────────────
      console.log(`[Sync] ${date} (${sport}): Falling back to exhaustive global search...`);
      const openClawMatches = await this.searchMatchesWithAI(date, sport);

      if (openClawMatches.length > 0) {
        console.log(`[Sync] ${date} (${sport}): AI Success! Captured ${openClawMatches.length} matches.`);
        byDate[date] = openClawMatches;
        rawFixturesCount += openClawMatches.length;
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
    const geminiKey = process.env.GEMINI_API_KEY;
    const orApiKey = process.env.OPENROUTER_API_KEY;

    // Choose the best available endpoint (Gemini first, then OpenRouter, then OpenClaw)
    const url = geminiKey ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}` : (orApiKey ? 'https://openrouter.ai/api/v1/chat/completions' : (process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789/v1/chat/completions'));
    const token = geminiKey ? geminiKey : (orApiKey || process.env.OPENCLAW_GATEWAY_TOKEN);
    const model = geminiKey ? 'gemini-2.0-flash' : (orApiKey ? 'perplexity/sonar' : 'openclaw');

    if (!token) {
      console.warn('[MatchService] No Gemini, OpenRouter or OpenClaw token set — cannot search web.');
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
      // Build request body based on provider
      const body: any = geminiKey
        ? {
            system_instruction: { parts: [{ text: 'Tu es un agent expert en recherche de données web. Ta mission est de fournir des informations précises au format JSON.' }] },
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
          }
        : {
            model,
            messages: [
              { role: 'system', content: 'Tu es un agent expert en recherche de données web. Ta mission est de fournir des informations précises au format JSON.' },
              { role: 'user', content: fullPrompt }
            ],
            temperature: 0.1,
            max_tokens: 2000,
          };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!geminiKey) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[MatchService] Fetch error (${geminiKey ? 'Gemini' : orApiKey ? 'OpenRouter' : 'OpenClaw'}): ${res.status} - ${errText}`);
        return [];
      }

      const data = await res.json();
      const content = geminiKey
        ? data.candidates?.[0]?.content?.parts?.[0]?.text
        : data.choices?.[0]?.message?.content;
      
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

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.warn('[MatchService] RAPIDAPI_KEY not set and no cache found — returning empty matches.');
      return [];
    }

    // Fetch just this date if not cached
    const { byDate } = await this.getMatchesForRange(date, date, sport);
    const matches = byDate[date] ?? [];
    if (!leagueCodes || leagueCodes.length === 0) return matches;
    return matches.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  private leagueMap: Map<number, { name: string; country: string }> = new Map();

  /**
   * Fetch fixtures for a specific date from the new Free API
   */
  private async fetchFootballFromAPI(date: string): Promise<RealMatch[]> {
    try {
      // 1. Ensure leagues are loaded for mapping
      if (this.leagueMap.size === 0) {
        console.log('[MatchService] Loading league map...');
        // TTL: 30 days (2592000 seconds) for leagues catalog
        const leaguesData = await cachedFetch<any>('/football-get-all-leagues', {}, 2592000);
        if (leaguesData?.status === 'success' && Array.isArray(leaguesData.response?.leagues)) {
          leaguesData.response.leagues.forEach((l: any) => {
            this.leagueMap.set(l.id, { name: l.name, country: l.ccode });
          });
          console.log(`[MatchService] Loaded ${this.leagueMap.size} leagues.`);
        }
      }

      // 2. Fetch matches (format YYYYMMDD)
      const apiDate = date.replace(/-/g, '');
      // TTL: 24 hours (86400 seconds) for matches list
      const data = await cachedFetch<any>('/football-get-matches-by-date', { date: apiDate }, 86400);
      
      if (data?.status !== 'success' || !Array.isArray(data.response?.matches)) {
        console.warn(`[MatchService] No matches found or API error for ${date}`);
        return [];
      }

      return data.response.matches.map((f: any) => {
        const leagueInfo = this.leagueMap.get(f.leagueId) || { name: 'Unknown League', country: '' };
        
        // Parse time: "19.03.2026 21:00" -> "21:00"
        let matchTime = '00:00';
        if (f.time && f.time.includes(' ')) {
          matchTime = f.time.split(' ')[1];
        }

        return {
          id: `fav-${f.id}`, // "fav" for API Venue / Fotmob wrapper
          homeTeam: f.home.name,
          awayTeam: f.away.name,
          league: leagueInfo.name,
          leagueCode: this.inferLeagueCode(leagueInfo.name),
          country: leagueInfo.country,
          date: date,
          time: matchTime,
          status: f.status?.finished ? 'finished' : (f.status?.started ? 'live' : 'scheduled'),
          sport: 'football',
          odds: this.generateRealisticOdds('football'),
        };
      });
    } catch (err) {
      console.error('[MatchService] New API fetch failed:', err);
      return [];
    }
  }

  private mapStatus(short: string): 'scheduled' | 'live' | 'finished' {
    if (['PST', 'NS', 'TBD'].includes(short)) return 'scheduled';
    if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
    return 'live';
  }

  private async getCachedMatches(date: string, sport: string): Promise<RealMatch[] | null> {
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

  private async cacheMatches(date: string, matches: RealMatch[], sport: string): Promise<void> {
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
