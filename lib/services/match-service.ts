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

    // Run all segments in parallel for speed
    const segmentResults = await Promise.all(
      segments.map(segment => {
        console.log(`[MatchService] Querying segment: ${segment.name}...`);
        return this.fetchOpenClawSegment(date, segment.prompt, sport);
      })
    );
    const allMatches: RealMatch[] = segmentResults.flat();

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
    const l = leagueName.trim().toUpperCase();
    // Exact or anchor matches only — avoids "Premier League Russe" / "Bundesliga Autrichienne" false positives
    // England
    if (l === 'PREMIER LEAGUE' || l.includes('ENGLISH PREMIER')) return 'PL';
    if (l === 'CHAMPIONSHIP' || l === 'EFL CHAMPIONSHIP') return 'ENG2';
    // Spain
    if (l === 'LA LIGA' || l === 'LALIGA' || l === 'PRIMERA DIVISIÓN' || l === 'PRIMERA DIVISION') return 'LA';
    if (l === 'LA LIGA 2' || l === 'LALIGA 2' || l === 'SEGUNDA DIVISIÓN' || l === 'SEGUNDA DIVISION') return 'ESP2';
    // Italy
    if (l === 'SERIE A') return 'SA';
    if (l === 'SERIE B') return 'ITA2';
    // Germany
    if (l === 'BUNDESLIGA' || l === '1. BUNDESLIGA') return 'BL';
    if (l === '2. BUNDESLIGA' || l === '2.BUNDESLIGA') return 'GER2';
    // France
    if (l === 'LIGUE 1' || l === 'LIGUE1') return 'FL';
    if (l === 'LIGUE 2' || l === 'LIGUE2') return 'FRA2';
    // Europe
    if (l.includes('CHAMPIONS LEAGUE') || l.includes('UEFA CL') || l === 'UCL') return 'CL';
    if (l.includes('EUROPA LEAGUE') || l.includes('UEFA EL') || l === 'UEL') return 'EL';
    if (l.includes('CONFERENCE LEAGUE') || l === 'UECL') return 'ECL';
    // Americas
    if (l === 'MLS' || l.includes('MAJOR LEAGUE SOCCER')) return 'US1';
    if (l === 'LIGA MX') return 'MX1';
    if (l.includes('BRASILEIRAO') || l.includes('CAMPEONATO BRASILEIRO')) return 'BR1';
    // Africa
    if (l.includes('SÉNÉGAL') || l.includes('SENEGAL')) return 'SN1';
    if (l.includes("CÔTE D'IVOIRE") || l.includes("COTE D'IVOIRE") || l.includes('IVORY COAST')) return 'CI1';
    if (l.includes('BÉNIN') || l.includes('BENIN')) return 'BJ1';
    return 'TOP';
  }

  // Single-date fetch (reads from cache first, falls back to range fetch)
  async getMatchesForDate(date: string, sport: string = 'football', leagueCodes?: string[]): Promise<RealMatch[]> {
    const cached = await this.getCachedMatches(date, sport);
    if (cached && cached.length > 0) {
      return this.filterByLeague(cached, leagueCodes);
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      console.warn('[MatchService] API_FOOTBALL_KEY not set and no cache found — returning empty matches.');
      return [];
    }

    // Fetch just this date if not cached
    const { byDate } = await this.getMatchesForRange(date, date, sport);
    const matches = byDate[date] ?? [];
    return this.filterByLeague(matches, leagueCodes);
  }

  /** Filter matches by league codes, falling back to 'TOP' (unclassified) if no match found */
  private filterByLeague(matches: RealMatch[], leagueCodes?: string[]): RealMatch[] {
    if (!leagueCodes || leagueCodes.length === 0) return matches;

    // Re-infer leagueCode from league name for stale cache entries tagged as 'TOP'
    const normalized = matches.map((m) => {
      if (m.leagueCode !== 'TOP') return m;
      const reInferred = this.inferLeagueCode(m.league);
      if (reInferred === 'TOP') return m;
      const info = MatchService.LEAGUE_CODE_TO_INFO[reInferred];
      return {
        ...m,
        leagueCode: reInferred,
        league: m.league === 'Unknown League' && info ? info.name : m.league,
        country: (!m.country && info) ? info.country : m.country,
      };
    });

    return normalized.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  /**
   * Static league ID → display info map.
   * Replaces the broken /football-get-all-leagues API call (returns "status: failed" on free plan).
   * IDs verified from live API fixtures (2026-03-21).
   */
  private static readonly LEAGUE_ID_TO_INFO: Record<number, { name: string; country: string }> = {
    // Top 5 leagues
    47:  { name: 'Premier League',        country: 'Angleterre' },
    53:  { name: 'Ligue 1',              country: 'France' },
    54:  { name: 'Bundesliga',            country: 'Allemagne' },
    55:  { name: 'Serie A',              country: 'Italie' },
    87:  { name: 'La Liga',              country: 'Espagne' },
    // England
    900638: { name: 'Championship',      country: 'Angleterre' },
    900639: { name: 'League One',        country: 'Angleterre' },
    900640: { name: 'League Two',        country: 'Angleterre' },
    9084:   { name: 'Premier League U21',country: 'Angleterre' },
    10068:  { name: 'Premier League U18',country: 'Angleterre' },
    9227:   { name: "Women's Super League", country: 'Angleterre' },
    // France
    110:  { name: 'Ligue 2',             country: 'France' },
    8970: { name: 'National',            country: 'France' },
    901477: { name: 'Division 1 Féminine', country: 'France' },
    // Germany
    146:    { name: '2. Bundesliga',     country: 'Allemagne' },
    208:    { name: '3. Liga',           country: 'Allemagne' },
    888:    { name: 'DFB-Pokal',         country: 'Allemagne' },
    9676:   { name: 'Frauen-Bundesliga', country: 'Allemagne' },
    899888: { name: 'Regionalliga Bayern', country: 'Allemagne' },
    899890: { name: 'Regionalliga Nord', country: 'Allemagne' },
    901198: { name: 'Regionalliga Nord 2', country: 'Allemagne' },
    901354: { name: 'Regionalliga Südwest', country: 'Allemagne' },
    901355: { name: 'Regionalliga West', country: 'Allemagne' },
    // Italy
    902171: { name: 'Serie B',          country: 'Italie' },
    901979: { name: 'Serie C',          country: 'Italie' },
    901968: { name: 'Serie C Groupe B', country: 'Italie' },
    901990: { name: 'Serie C Play-off', country: 'Italie' },
    901923: { name: 'Serie A Femminile', country: 'Italie' },
    // Spain
    901075: { name: 'La Liga 2',        country: 'Espagne' },
    901481: { name: 'Segunda Federación', country: 'Espagne' },
    901480: { name: 'Primera Federación', country: 'Espagne' },
    901483: { name: 'Tercera Federación Gr.8', country: 'Espagne' },
    901484: { name: 'Tercera Federación Gr.15', country: 'Espagne' },
    901485: { name: 'Tercera Federación Gr.11', country: 'Espagne' },
    901486: { name: 'Tercera Federación Gr.10', country: 'Espagne' },
    901487: { name: 'Tercera Federación Gr.7', country: 'Espagne' },
    902647: { name: 'Primera Federación Féminine', country: 'Espagne' },
    // Portugal
    61:   { name: 'Primeira Liga',       country: 'Portugal' },
    185:  { name: 'Liga Portugal 2',     country: 'Portugal' },
    920295: { name: 'Liga 3',            country: 'Portugal' },
    920297: { name: 'Campeonato de Portugal Gr.B', country: 'Portugal' },
    920298: { name: 'Campeonato de Portugal Gr.C', country: 'Portugal' },
    905808: { name: 'Liga BPI Féminine', country: 'Portugal' },
    // Netherlands
    900368: { name: 'Eredivisie',        country: 'Pays-Bas' },
    111:    { name: 'Eerste Divisie',    country: 'Pays-Bas' },
    9195:   { name: 'Tweede Divisie',   country: 'Pays-Bas' },
    10289:  { name: 'Vrouwen Eredivisie', country: 'Pays-Bas' },
    // Scotland
    900474: { name: 'Scottish Premiership', country: 'Écosse' },
    900476: { name: 'Scottish Championship', country: 'Écosse' },
    900477: { name: 'Scottish League One', country: 'Écosse' },
    900478: { name: 'Scottish League Two', country: 'Écosse' },
    9545:   { name: 'Scottish Lowland League', country: 'Écosse' },
    // Belgium
    264:    { name: 'Pro League',        country: 'Belgique' },
    // Switzerland
    900529: { name: 'Super League',      country: 'Suisse' },
    900530: { name: 'Challenge League',  country: 'Suisse' },
    // Austria
    923518: { name: 'Bundesliga Autrichienne', country: 'Autriche' },
    900626: { name: '2. Liga Autrichienne',    country: 'Autriche' },
    // Russia
    63:    { name: 'Premier League Russe', country: 'Russie' },
    901329: { name: 'First League Russe', country: 'Russie' },
    // Ukraine
    900627: { name: 'Premier League Ukrainienne', country: 'Ukraine' },
    // Turkey
    165:    { name: 'TFF 1. Lig',        country: 'Turquie' },
    // Norway
    59:    { name: 'Eliteserien',        country: 'Norvège' },
    333:   { name: 'Toppserien (W)',      country: 'Norvège' },
    916229:{ name: 'Toppserien Féminin', country: 'Norvège' },
    921414:{ name: 'Toppserien 1 (W)',   country: 'Norvège' },
    // Denmark
    900339: { name: '1. Division',       country: 'Danemark' },
    900633: { name: '2. Division',       country: 'Danemark' },
    900634: { name: '3. Division',       country: 'Danemark' },
    916899: { name: 'Kvindeligaen (W)',  country: 'Danemark' },
    // Poland
    197:    { name: '1. Liga',           country: 'Pologne' },
    899985: { name: 'Ekstraklasa',       country: 'Pologne' },
    8935:   { name: '2. Liga',           country: 'Pologne' },
    // Ireland
    126:    { name: 'League of Ireland Prem.', country: 'Irlande' },
    916016: { name: 'First Division',    country: 'Irlande' },
    10210:  { name: "Women's National League", country: 'Irlande' },
    // Northern Ireland
    900833: { name: 'NIFL Premiership',  country: 'Irlande du Nord' },
    // Serbia
    182:    { name: 'Superliga',         country: 'Serbie' },
    // Croatia
    252:    { name: 'HNL',              country: 'Croatie' },
    // Bulgaria
    9096:   { name: 'Segunda Liga',      country: 'Bulgarie' },
    899885: { name: 'Parva Liga',        country: 'Bulgarie' },
    // Romania
    923553: { name: 'Liga 1',            country: 'Roumanie' },
    923521: { name: 'Liga 2',            country: 'Roumanie' },
    923942: { name: 'Liga 3',            country: 'Roumanie' },
    924028: { name: 'Liga 4',            country: 'Roumanie' },
    924029: { name: 'Liga 4',            country: 'Roumanie' },
    // Hungary
    212:    { name: 'OTP Bank Liga',     country: 'Hongrie' },
    // Slovakia
    922965: { name: 'Fortuna Liga',      country: 'Slovaquie' },
    922967: { name: 'Druhá liga',        country: 'Slovaquie' },
    901093: { name: 'Tretia liga',       country: 'Slovaquie' },
    // Czech Republic
    253:    { name: '2. liga',           country: 'Tchéquie' },
    // Slovenia
    173:    { name: 'Prva liga',         country: 'Slovénie' },
    // Montenegro
    232:    { name: 'Prva CFL',          country: 'Monténégro' },
    // Bosnia
    900837: { name: 'Premier liga',      country: 'Bosnie' },
    // North Macedonia
    249:    { name: 'Prva fudbalska liga', country: 'Macédoine du Nord' },
    // Albania
    260:    { name: 'Superliga',         country: 'Albanie' },
    // Kosovo
    262:    { name: 'Superliga',         country: 'Kosovo' },
    // Cyprus
    924301: { name: 'First Division',    country: 'Chypre' },
    924302: { name: 'Second Division',   country: 'Chypre' },
    918603: { name: 'Third Division',    country: 'Chypre' },
    918604: { name: 'Fourth Division',   country: 'Chypre' },
    // Greece
    920541: { name: 'Super League 2',    country: 'Grèce' },
    920542: { name: 'Gamma Ethniki',     country: 'Grèce' },
    // Armenia
    118:    { name: 'Armenian Premier League', country: 'Arménie' },
    // Azerbaijan / Costa Rica (both used ID 914695 in different contexts — Costa Rica entry below takes precedence)
    // 914695: { name: 'Azerbaijani Premier League', country: 'Azerbaïdjan' },
    // Estonia
    248:    { name: 'Meistriliiga',      country: 'Estonie' },
    // Latvia
    226:    { name: 'Virsliga',          country: 'Lettonie' },
    // Lithuania
    228:    { name: 'A Lyga',            country: 'Lituanie' },
    // Moldova
    915154: { name: 'Divizia Nationala', country: 'Moldavie' },
    // Belarus
    923169: { name: 'Vysshaya Liga',     country: 'Biélorussie' },
    // Finland
    923292: { name: 'Veikkausliiga',     country: 'Finlande' },
    // Faroe Islands
    250:    { name: 'Premier League Féroïenne', country: 'Îles Féroé' },
    // Iceland
    923865: { name: 'Úrvalsdeild',       country: 'Islande' },
    // Kazakhstan
    922739: { name: 'Premier Liga',      country: 'Kazakhstan' },
    // Wales
    919717: { name: 'Cymru Premier',     country: 'Pays de Galles' },
    919718: { name: 'Cymru North/South', country: 'Pays de Galles' },
    // England lower
    901315: { name: 'National League',   country: 'Angleterre' },
    901317: { name: 'National League North', country: 'Angleterre' },
    901319: { name: 'National League South', country: 'Angleterre' },
    901529: { name: 'Southern League',   country: 'Angleterre' },
    901530: { name: 'Southern League Central', country: 'Angleterre' },
    901535: { name: 'Northern Premier League', country: 'Angleterre' },
    901537: { name: 'Isthmian League',   country: 'Angleterre' },
    // Americas
    913550: { name: 'MLS',              country: 'États-Unis' },
    916051: { name: 'Liga MX',          country: 'Mexique' },
    916290: { name: 'Liga de Expansión MX', country: 'Mexique' },
    916500: { name: 'Liga MX Femenil',  country: 'Mexique' },
    905256: { name: 'Liga Profesional', country: 'Argentine' },
    916553: { name: 'Primera Nacional', country: 'Argentine' },
    916561: { name: 'Primera B Metro.', country: 'Argentine' },
    923718: { name: 'Torneo Federal A', country: 'Argentine' },
    923719: { name: 'Torneo Federal A', country: 'Argentine' },
    923720: { name: 'Torneo Federal A', country: 'Argentine' },
    920319: { name: 'Primera División', country: 'Uruguay' },
    919710: { name: 'Liga 1',           country: 'Pérou' },
    917521: { name: 'Liga Betplay',     country: 'Colombie' },
    920002: { name: 'Primera B',        country: 'Colombie' },
    9305:   { name: 'Superliga',        country: 'Argentine' },
    9126:   { name: 'Primera División Gr.', country: 'Chili' },
    // Costa Rica / Honduras / Panama
    914695: { name: 'Primera División', country: 'Costa Rica' },
    918407: { name: 'Liga Nacional',    country: 'Honduras' },
    918463: { name: 'LPF',             country: 'Panama' },
    // Asia / Oceania
    8984:   { name: 'Thai League 1',    country: 'Thaïlande' },
    9498:   { name: 'Thai League 2',    country: 'Thaïlande' },
    919356: { name: 'K League 1',       country: 'Corée du Sud' },
    920066: { name: 'K League 2',       country: 'Corée du Sud' },
    922584: { name: 'K3 League',        country: 'Corée du Sud' },
    918259: { name: 'J1 League',        country: 'Japon' },
    918271: { name: 'J2 League',        country: 'Japon' },
    918269: { name: 'J3 League',        country: 'Japon' },
    918273: { name: 'J3 League South',  country: 'Japon' },
    920186: { name: 'ISL',             country: 'Inde' },
    9495:   { name: 'A-League',         country: 'Australie' },
    901954: { name: 'A-League',         country: 'Australie' },
    9943:   { name: 'Arabian Gulf League', country: 'Émirats Arabes Unis' },
    902649: { name: 'Premier League Koweïtienne', country: 'Koweït' },
    905798: { name: 'Iraqi Premier League', country: 'Irak' },
    921190: { name: 'CAF Champions League', country: 'Afrique' },
    902634: { name: 'DStv Premiership', country: 'Afrique du Sud' },
    9066:   { name: 'NBC Premier League', country: 'Tanzanie' },
    920228: { name: 'NWSL',             country: 'États-Unis' },
    923536: { name: 'AFC Women\'s Olympic Qual.', country: 'Asie' },
    1000000881: { name: 'Qualification CAN', country: 'Afrique' },
    923880: { name: 'Egyptian Premier League', country: 'Égypte' },
    920266: { name: 'Super League',     country: 'Chine' },
    920267: { name: 'China League One', country: 'Chine' },
  };

  /**
   * Maps leagueId → exact league code.
   * MUST be used instead of inferLeagueCode() to avoid false matches
   * (e.g. Russian "Premier League" → 'PL', Austrian "Bundesliga" → 'BL').
   */
  private static readonly LEAGUE_ID_TO_CODE: Record<number, string> = {
    // ── Top 5 European leagues ──────────────────────────────────────────────
    47:  'PL',   // English Premier League
    53:  'FL',   // Ligue 1
    54:  'BL',   // Bundesliga
    55:  'SA',   // Serie A
    87:  'LA',   // La Liga
    // ── European 2nd tiers ──────────────────────────────────────────────────
    900638: 'ENG2', // Championship
    900639: 'ENG3', // League One
    900640: 'ENG4', // League Two
    110:    'FRA2', // Ligue 2
    146:    'GER2', // 2. Bundesliga
    208:    'GER3', // 3. Liga
    902171: 'ITA2', // Serie B
    901075: 'ESP2', // La Liga 2
    // ── UEFA ────────────────────────────────────────────────────────────────
    42:  'CL',   // UEFA Champions League
    73:  'EL',   // UEFA Europa League
    480: 'ECL',  // UEFA Conference League
    // ── Americas ────────────────────────────────────────────────────────────
    913550: 'US1',  // MLS
    916051: 'MX1',  // Liga MX
    // ── Explicit 'TOP' for leagues whose names would trigger false positives ─
    // (e.g. "Premier League" named leagues outside England, "Bundesliga" outside Germany)
    63:     'TOP',  // Russian Premier League
    901329: 'TOP',  // Russian First League
    900627: 'TOP',  // Ukrainian Premier League
    923518: 'TOP',  // Austrian Bundesliga
    900626: 'TOP',  // Austrian 2. Liga
    250:    'TOP',  // Faroe Islands Premier League
    902649: 'TOP',  // Kuwait Premier League
    9084:   'TOP',  // EPL U21 (not a first-team competition)
    10068:  'TOP',  // EPL U18
    9227:   'TOP',  // Women's Super League (separate competition)
    9676:   'TOP',  // German Frauen-Bundesliga
    901923: 'TOP',  // Italian Serie A Femminile
    // All other leagues → fallback to inferLeagueCode → 'TOP' for unknowns
  };

  /** Fallback: derive a proper display name+country from the inferred league code */
  private static readonly LEAGUE_CODE_TO_INFO: Record<string, { name: string; country: string }> = {
    PL:  { name: 'Premier League',            country: 'Angleterre' },
    LA:  { name: 'La Liga',                   country: 'Espagne' },
    SA:  { name: 'Serie A',                   country: 'Italie' },
    BL:  { name: 'Bundesliga',                country: 'Allemagne' },
    FL:  { name: 'Ligue 1',                   country: 'France' },
    CL:  { name: 'UEFA Champions League',     country: 'Europe' },
    EL:  { name: 'UEFA Europa League',        country: 'Europe' },
    ECL: { name: 'UEFA Conference League',    country: 'Europe' },
    ENG2: { name: 'Championship',             country: 'Angleterre' },
    ITA2: { name: 'Serie B',                  country: 'Italie' },
    GER2: { name: '2. Bundesliga',            country: 'Allemagne' },
    FRA2: { name: 'Ligue 2',                  country: 'France' },
    US1:  { name: 'MLS',                      country: 'États-Unis' },
    BR1:  { name: 'Brasileirão',              country: 'Brésil' },
    MX1:  { name: 'Liga MX',                  country: 'Mexique' },
    SN1:  { name: 'Ligue 1 Sénégal',         country: 'Sénégal' },
    CI1:  { name: "Ligue 1 Côte d'Ivoire",   country: "Côte d'Ivoire" },
    BJ1:  { name: 'Championnat Bénin',        country: 'Bénin' },
  };

  /**
   * Fetch fixtures for a specific date from API-Football v3 (api-football.com)
   * Endpoint: GET /fixtures?date=YYYY-MM-DD
   * Response: { response: [{ fixture: { id, date, status: { short } }, league: { id, name, country }, teams: { home, away } }] }
   */
  private async fetchFootballFromAPI(date: string): Promise<RealMatch[]> {
    try {
      // 1. Fetch fixtures — API-Football v3 uses YYYY-MM-DD format natively
      const data = await cachedFetch<any>('/fixtures', { date }, 86400);

      if (!Array.isArray(data?.response)) {
        console.warn(`[MatchService] No fixtures from API-Football for ${date}. Response:`, JSON.stringify(data).substring(0, 300));
        return [];
      }

      console.log(`[MatchService] API-Football returned ${data.response.length} fixtures for ${date}`);

      const rawMatches = data.response.map((f: any) => {
        const leagueId = Number(f.league?.id);
        const leagueName: string = f.league?.name ?? '';
        const leagueCountry: string = f.league?.country ?? '';

        // Resolve league info: static map by leagueId first, then from API fields
        const leagueInfo: { name: string; country: string } =
          MatchService.LEAGUE_ID_TO_INFO[leagueId]
          ?? (() => {
            const code = leagueName ? this.inferLeagueCode(leagueName) : 'TOP';
            return (code !== 'TOP' && MatchService.LEAGUE_CODE_TO_INFO[code])
              ? MatchService.LEAGUE_CODE_TO_INFO[code]
              : { name: leagueName || `Unknown (id=${leagueId})`, country: leagueCountry };
          })();

        // Parse time from ISO date: "2026-03-22T21:00:00+00:00" -> "21:00"
        let matchTime = '00:00';
        if (f.fixture?.date) {
          const d = new Date(f.fixture.date);
          matchTime = d.toISOString().substring(11, 16);
        }

        return {
          raw: f,
          leagueInfo,
          leagueId,
          matchTime,
          homeTeam: f.teams?.home?.name ?? 'Unknown',
          awayTeam: f.teams?.away?.name ?? 'Unknown',
        };
      });

      // ── Step 1: Fetch real bookmaker odds from The Odds API ──────────────
      const oddsMap = await this.fetchOddsFromTheOddsAPI(date);
      const oddsSource = oddsMap.size > 0 ? 'TheOddsAPI' : 'none';
      console.log(`[MatchService] Odds source: ${oddsSource} (${oddsMap.size} events with real odds)`);

      // ── Step 2: Assign odds per match (real → Gemini fallback) ───────────
      const matchedByReal: boolean[] = rawMatches.map((m: { homeTeam: string; awayTeam: string }) => {
        return oddsMap.has(this.makeOddsKey(m.homeTeam, m.awayTeam)) ||
          this.lookupOdds(m.homeTeam, m.awayTeam, oddsMap) !== null;
      });

      // Gemini batch only for matches not covered by The Odds API
      const needsGemini = rawMatches.filter((_: any, i: number) => !matchedByReal[i]);
      let geminiOdds: Array<{ home: number; draw: number; away: number }> = [];
      if (needsGemini.length > 0) {
        console.log(`[MatchService] ${needsGemini.length} matches need Gemini odds estimation...`);
        geminiOdds = await this.estimateOddsWithGemini(
          needsGemini.map((m: { homeTeam: string; awayTeam: string; leagueInfo: { name: string } }) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.leagueInfo.name,
          }))
        );
      }

      let geminiIdx = 0;
      return rawMatches.map((m: { raw: any; leagueInfo: { name: string; country: string }; leagueId: number; matchTime: string; homeTeam: string; awayTeam: string }, idx: number) => {
        let odds: { home: number; draw?: number; away: number };

        if (matchedByReal[idx]) {
          const realOdds = this.lookupOdds(m.homeTeam, m.awayTeam, oddsMap);
          odds = realOdds ?? this.generateRealisticOdds('football');
        } else {
          odds = geminiOdds[geminiIdx++] ?? this.generateRealisticOdds('football');
        }

        // Resolve league code by ID first (avoids false matches like Russian "Premier League" → 'PL')
        const code = MatchService.LEAGUE_ID_TO_CODE[m.leagueId]
          ?? this.inferLeagueCode(m.leagueInfo.name);
        const knownInfo = code !== 'TOP' ? MatchService.LEAGUE_CODE_TO_INFO[code] : null;
        const finalCountry = m.leagueInfo.country || (knownInfo?.country ?? '');

        // Map API-Football v3 status short codes
        const statusShort: string = m.raw.fixture?.status?.short ?? 'NS';

        return {
          id: `apif-${m.raw.fixture?.id ?? Math.random()}`,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.leagueInfo.name,
          leagueCode: code,
          country: finalCountry,
          date,
          time: m.matchTime,
          status: this.mapStatus(statusShort),
          sport: 'football',
          odds,
        };
      });
    } catch (err) {
      console.error('[MatchService] API fetch failed:', err);
      return [];
    }
  }

  private mapStatus(short: string): 'scheduled' | 'live' | 'finished' {
    if (['PST', 'NS', 'TBD'].includes(short)) return 'scheduled';
    if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
    return 'live';
  }

  // ── The Odds API integration ───────────────────────────────────────────────

  /** Major soccer sport keys covered by The Odds API (EU bookmakers, h2h market) */
  private readonly ODDS_SPORT_KEYS = [
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_italy_serie_a',
    'soccer_germany_bundesliga',
    'soccer_france_ligue_one',
    'soccer_uefa_champs_league',
    'soccer_europa_league',
  ];

  /**
   * Fetch real 1X2 bookmaker odds from The Odds API for a given date.
   * Results are cached in api_cache for 6 hours to save credits.
   * Returns a Map keyed by "home::away" (normalized) → { home, draw, away }.
   */
  private async fetchOddsFromTheOddsAPI(
    date: string
  ): Promise<Map<string, { home: number; draw: number; away: number }>> {
    const apiKey = process.env.THE_ODDS_API_KEY;
    const oddsMap = new Map<string, { home: number; draw: number; away: number }>();

    if (!apiKey) {
      console.warn('[OddsAPI] THE_ODDS_API_KEY not set — skipping real odds fetch.');
      return oddsMap;
    }

    const supabase = createAdminClient();
    const cacheKey = `the-odds-api:soccer:${date}`;

    // Try Supabase cache first (6h TTL)
    try {
      const { data: cached } = await supabase
        .from('api_cache')
        .select('data, fetched_at')
        .eq('cache_key', cacheKey)
        .single();

      if (cached) {
        const ageSeconds = (Date.now() - new Date(cached.fetched_at).getTime()) / 1000;
        if (ageSeconds < 21600) {
          console.log(`[OddsAPI] Cache HIT for ${date}`);
          this.hydrateOddsMap(cached.data as any[], oddsMap);
          return oddsMap;
        }
      }
    } catch { /* cache miss, continue */ }

    // Fetch from all sport keys in parallel
    const [nextDay] = [new Date(date)];
    nextDay.setDate(nextDay.getDate() + 1);
    const commenceTimeFrom = `${date}T00:00:00Z`;
    const commenceTimeTo = nextDay.toISOString().split('T')[0] + 'T00:00:00Z';

    console.log(`[OddsAPI] Fetching real odds for ${date} (${this.ODDS_SPORT_KEYS.length} competitions)...`);

    const results = await Promise.allSettled(
      this.ODDS_SPORT_KEYS.map(async (sportKey) => {
        const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`);
        url.searchParams.set('apiKey', apiKey);
        url.searchParams.set('regions', 'eu');
        url.searchParams.set('markets', 'h2h');
        url.searchParams.set('oddsFormat', 'decimal');
        url.searchParams.set('dateFormat', 'iso');
        url.searchParams.set('commenceTimeFrom', commenceTimeFrom);
        url.searchParams.set('commenceTimeTo', commenceTimeTo);

        const res = await fetch(url.toString());
        if (!res.ok) {
          console.warn(`[OddsAPI] ${sportKey}: ${res.status}`);
          return [] as any[];
        }
        const remaining = res.headers.get('x-requests-remaining');
        if (remaining) console.log(`[OddsAPI] Credits remaining: ${remaining}`);
        return res.json() as Promise<any[]>;
      })
    );

    const allEvents: any[] = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

    // Persist to cache
    if (allEvents.length > 0) {
      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: allEvents,
        fetched_at: new Date().toISOString(),
      });
    }

    this.hydrateOddsMap(allEvents, oddsMap);
    console.log(`[OddsAPI] ${oddsMap.size} matches with real odds loaded for ${date}.`);
    return oddsMap;
  }

  /** Populate oddsMap from a The Odds API event list */
  private hydrateOddsMap(
    events: any[],
    oddsMap: Map<string, { home: number; draw: number; away: number }>
  ): void {
    for (const event of events) {
      if (!event?.bookmakers?.length) continue;

      // Average h2h market across bookmakers for stability
      const allOutcomes: { home: number[]; draw: number[]; away: number[] } = { home: [], draw: [], away: [] };

      for (const bm of event.bookmakers) {
        const h2h = bm.markets?.find((m: any) => m.key === 'h2h');
        if (!h2h?.outcomes) continue;
        for (const o of h2h.outcomes) {
          const price = Number(o.price);
          if (!price || price < 1) continue;
          if (o.name === event.home_team) allOutcomes.home.push(price);
          else if (o.name === event.away_team) allOutcomes.away.push(price);
          else allOutcomes.draw.push(price);
        }
      }

      const avg = (arr: number[]) =>
        arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;

      const homeOdd = avg(allOutcomes.home);
      const awayOdd = avg(allOutcomes.away);
      const drawOdd = avg(allOutcomes.draw);

      if (!homeOdd || !awayOdd) continue;

      const key = this.makeOddsKey(event.home_team, event.away_team);
      oddsMap.set(key, { home: homeOdd, draw: drawOdd || 3.2, away: awayOdd });
    }
  }

  /** Normalize a team name for fuzzy matching */
  private normalizeTeam(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\b(fc|cf|sc|ac|as|rc|us|ss|vfb|rb|bsc|fk|sk|if|afc|lfc|cfc)\b/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private makeOddsKey(home: string, away: string): string {
    return `${this.normalizeTeam(home)}::${this.normalizeTeam(away)}`;
  }

  /**
   * Look up odds for a match. Tries exact key, then partial word overlap.
   */
  private lookupOdds(
    homeTeam: string,
    awayTeam: string,
    oddsMap: Map<string, { home: number; draw: number; away: number }>
  ): { home: number; draw: number; away: number } | null {
    const exactKey = this.makeOddsKey(homeTeam, awayTeam);
    if (oddsMap.has(exactKey)) return oddsMap.get(exactKey)!;

    // Fuzzy: find the closest key where both team names overlap significantly
    const normHome = this.normalizeTeam(homeTeam);
    const normAway = this.normalizeTeam(awayTeam);

    for (const [key, odds] of Array.from(oddsMap.entries())) {
      const [kHome, kAway] = key.split('::');
      if (this.wordOverlap(normHome, kHome) && this.wordOverlap(normAway, kAway)) {
        return odds;
      }
    }
    return null;
  }

  /** Returns true if the longer string contains the shorter one (by words) */
  private wordOverlap(a: string, b: string): boolean {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    const wordsA = a.split(' ').filter((w) => w.length > 2);
    const wordsB = b.split(' ').filter((w) => w.length > 2);
    return wordsA.some((w) => wordsB.includes(w));
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

      const matches = data.matches as RealMatch[];

      // Detect corrupted cache: if >50% of matches have 'Unknown League', invalidate it
      if (matches.length > 0) {
        const unknownCount = matches.filter((m) => m.league === 'Unknown League').length;
        if (unknownCount / matches.length > 0.5) {
          console.warn(`[MatchService] Cache for ${date} is corrupted (${unknownCount}/${matches.length} unknown leagues) — purging`);
          await supabase.from('matches_cache').delete().eq('date', date).eq('sport', sport);
          return null;
        }
      }

      return matches;
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

  /**
   * Use Gemini to estimate realistic 1X2 odds for a batch of matches.
   * Gemini has training knowledge of team strengths — much better than pure random.
   * Processes in batches of 40 to stay within token limits.
   * Falls back to generateRealisticOdds() if Gemini is unavailable.
   */
  private async estimateOddsWithGemini(
    matches: Array<{ homeTeam: string; awayTeam: string; league: string }>
  ): Promise<Array<{ home: number; draw: number; away: number }>> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || matches.length === 0) {
      return matches.map(() => this.generateRealisticOdds('football') as { home: number; draw: number; away: number });
    }

    const BATCH_SIZE = 40;
    const allOdds: Array<{ home: number; draw: number; away: number }> = [];

    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
      const batch = matches.slice(i, i + BATCH_SIZE);
      const batchOdds = await this.fetchOddsBatchFromGemini(batch, geminiKey);
      allOdds.push(...batchOdds);
    }

    return allOdds;
  }

  private async fetchOddsBatchFromGemini(
    batch: Array<{ homeTeam: string; awayTeam: string; league: string }>,
    geminiKey: string
  ): Promise<Array<{ home: number; draw: number; away: number }>> {
    const fallback = batch.map(() => this.generateRealisticOdds('football') as { home: number; draw: number; away: number });

    const compact = batch.map((m, idx) => `${idx}:${m.homeTeam}|${m.awayTeam}|${m.league}`).join('\n');

    const prompt = `Tu es un expert bookmaker. Estime les cotes 1X2 réalistes pour ces matchs de football.
Utilise ta connaissance des équipes, du championnat et de l'avantage domicile.
Réponds UNIQUEMENT avec un tableau JSON de ${batch.length} objets dans le même ordre.
Format: [{"home":1.85,"draw":3.20,"away":3.40}, ...]
Règles: cotes entre 1.20 et 8.00, la somme des probabilités implicites doit être ~105-110%.

Matchs (index:domicile|extérieur|championnat):
${compact}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
          }),
        }
      );

      if (!res.ok) {
        console.warn(`[MatchService] Gemini odds batch error: ${res.status}`);
        return fallback;
      }

      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonStr = text.match(/\[[\s\S]*\]/)?.[0];
      if (!jsonStr) return fallback;

      const parsed: Array<{ home: number; draw: number; away: number }> = JSON.parse(jsonStr);
      if (!Array.isArray(parsed) || parsed.length !== batch.length) return fallback;

      return parsed.map((o) => ({
        home: Math.round(Math.max(1.10, Math.min(15.0, Number(o.home) || 1.85)) * 100) / 100,
        draw: Math.round(Math.max(1.10, Math.min(15.0, Number(o.draw) || 3.20)) * 100) / 100,
        away: Math.round(Math.max(1.10, Math.min(15.0, Number(o.away) || 3.40)) * 100) / 100,
      }));
    } catch (err) {
      console.warn('[MatchService] Gemini odds batch failed, using fallback:', err);
      return fallback;
    }
  }
}

export const matchService = new MatchService();
