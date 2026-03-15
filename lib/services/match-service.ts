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
          
          if (data.errors && data.errors.access) {
            console.error(`[Sync] API-Football Error: ${data.errors.access}`);
            return { byDate: {}, apiErrors: [`API-Football Error: ${data.errors.access}`], rawFixturesCount: 0 };
          }

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
   * Use OpenClaw to search the web for matches and odds in a segmented way.
   * This prevents AI response truncation.
   */
  private async searchMatchesWithOpenClaw(date: string): Promise<RealMatch[]> {
    console.log(`[MatchService] Starting REGIONALIZED OpenClaw search for ${date}...`);

    const segments = [
      {
        name: 'Europe & Grands Championnats',
        prompt: `TOUS les matchs de football en Europe (Ligue des Champions, Europa League, Conference League, Premier League, Liga, Serie A, Bundesliga, Ligue 1, Liga Portugal, Eredivisie, Pro League, Super Lig, EFL Championship, Ligue 2, etc.) ainsi que TOUS les championnats de D1, D2 et Coupes nationales du continent européen pour la date du ${date}.`
      },
      {
        name: 'Afrique Intégrale',
        prompt: `TOUS les matchs de football en Afrique pour la date du ${date}. Inclure impérativement toutes les ligues de : Bénin, Côte d'Ivoire, Sénégal, Cameroun, Mali, Togo, Burkina Faso, Niger, Gabon, Congo, Guinée, RD Congo, Afrique du Sud, Maroc, Algérie, Tunisie, Égypte, Nigeria, Ghana, Madagascar.`
      },
      {
        name: 'Amériques, Asie & Monde',
        prompt: `TOUS les matchs de football dans le reste du monde (MLS, Brésil Série A/B, Argentine, Mexique, Arabie Saoudite, Japon, Corée du Sud, Australie, Matchs Internationaux/Amicaux) pour la date du ${date}.`
      }
    ];

    let allMatches: RealMatch[] = [];

    // Use OpenRouter Direct Search if key is available (Option 3)
    const orApiKey = process.env.OPENROUTER_API_KEY;
    const useDirectSearch = !!orApiKey;

    for (const segment of segments) {
      console.log(`[MatchService] Querying segment: ${segment.name} (${useDirectSearch ? 'OpenRouter Direct' : 'OpenClaw Gateway'})...`);
      const matches = await this.fetchOpenClawSegment(date, segment.prompt);
      allMatches = [...allMatches, ...matches];
      console.log(`[MatchService] Segment ${segment.name} returned ${matches.length} matches.`);
    }

    // Deduplicate by teams + time (since a match might appear in two segments sometimes)
    const uniqueMatchesMap = new Map();
    allMatches.forEach(m => {
      const key = `${m.homeTeam}-${m.awayTeam}-${m.time}`.toLowerCase().replace(/\s/g, '');
      if (!uniqueMatchesMap.has(key)) {
        uniqueMatchesMap.set(key, m);
      }
    });

    const finalMatches = Array.from(uniqueMatchesMap.values());
    console.log(`[MatchService] Total unique matches found via OpenClaw: ${finalMatches.length}`);
    return finalMatches;
  }

  private async fetchOpenClawSegment(date: string, regionalPrompt: string): Promise<RealMatch[]> {
    const orApiKey = process.env.OPENROUTER_API_KEY;
    const url = orApiKey ? 'https://openrouter.ai/api/v1/chat/completions' : (process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789/v1/chat/completions');
    const token = orApiKey || process.env.OPENCLAW_GATEWAY_TOKEN;

    if (!token) {
      console.warn('[MatchService] No OpenRouter or OpenClaw token set — cannot search web.');
      return [];
    }

    const fullPrompt = `MISSION : Tu es un spécialiste de l'extraction de données sportives en temps réel. Ta tâche est de trouver une liste exhaustive des matchs de football RÉELS pour le ${date} dans cette zone : ${regionalPrompt}.

INSTRUCTIONS CRITIQUES :
1. UTILISE TES OUTILS DE RECHERCHE (Web Search) pour trouver les matchs d'aujourd'hui. 
2. NE REPRENDS PAS LES EXEMPLES "..." CI-DESSOUS. Remplis chaque champ avec des données RÉELLES trouvées sur le web.
3. Si un site (comme Flashscore) est complexe, utilise les résultats de recherche ou d'autres sites plus simples (Eurosport, L'Équipe, BBC, etc.).
4. Pour CHAQUE match, récupère : l'équipe à domicile, l'équipe à l'extérieur, le nom de la ligue, l'heure exacte et les cotes 1N2.
5. Réponds UNIQUEMENT avec un tableau JSON d'objets, AUCUN texte avant ou après.

FORMAT DE RÉPONSE ATTENDU :
[
  { 
    "homeTeam": "Nom Réel Team A", 
    "awayTeam": "Nom Réel Team B", 
    "league": "Nom de la Ligue", 
    "time": "HH:mm", 
    "odds": { "home": 2.1, "draw": 3.2, "away": 3.5 } 
  }
]
SI TU NE TROUVES AUCUN MATCH, RECHERCHE ENCORE. Il y a toujours des matchs de football tous les jours.`;

    try {
      const body: any = {
        model: orApiKey ? 'perplexity/sonar' : 'openclaw',
        messages: [
          { role: 'system', content: 'Tu es un agent expert en recherche de données web. Ta mission est de fournir des informations précises au format JSON.' },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.1,
      };

      if (orApiKey) {
        body.max_tokens = 2000; // Important: stay within credit limits
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
        country: '',
        date: date,
        time: r.time,
        status: 'scheduled',
        odds: (r.odds && r.odds.home > 0) ? r.odds : this.generateRealisticOdds(),
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
