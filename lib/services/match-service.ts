import { createAdminClient } from '../supabase/server';

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
    draw?: number;
    away: number;
    over25?: number;   // Over 2.5 goals
    under25?: number;  // Under 2.5 goals
    btts?: number;     // Both Teams To Score: Yes
    bttsNo?: number;   // Both Teams To Score: No
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
        // ── LEVEL 2: The Odds API (fixtures + odds, TTL 12h) ─────────────
        console.log(`[Sync] ${date} (FOOTBALL): Cache MISS — fetching via The Odds API...`);
        const apiMatches = await this.fetchFootballFromAPI(date);

        if (apiMatches.length > 0) {
          console.log(`[Sync] ${date} (FOOTBALL): Success! Found ${apiMatches.length} matches via The Odds API.`);
          byDate[date] = apiMatches;
          rawFixturesCount += apiMatches.length;
          await this.cacheMatches(date, apiMatches, sport);
          continue; // Found via API, skip AI fallback
        }

        console.error(`[Sync] ${date}: The Odds API returned 0 fixtures — vérifier THE_ODDS_API_KEY et crédits restants.`);
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
        odds: (r.odds && r.odds.home > 0) ? r.odds : undefined,
      }));
    } catch (err) {
      console.error('[MatchService] OpenClaw segment failed:', err);
      return [];
    }
  }

  /**
   * Map league name → code. Country is REQUIRED for top-5 leagues to prevent
   * false positives (e.g. Brazilian "Serie A" → 'SA', Argentine "Liga" → 'LA').
   * Only leagues whose country matches the expected country get the top-5 code.
   * All others fall through to 'TOP'.
   */
  private inferLeagueCode(leagueName: string, country?: string): string {
    const l = leagueName.trim().toUpperCase();
    const c = (country ?? '').trim().toUpperCase();

    // isCountry: requires a non-empty country string matching one of the candidates.
    // Empty country → always false → ambiguous league names fall through to 'TOP'.
    const isCountry = (...candidates: string[]) =>
      c.length > 0 && candidates.some(cand => c.includes(cand.toUpperCase()));

    // ── Top-5 with strict country guard ─────────────────────────────────────
    // England / Premier League
    if ((l === 'PREMIER LEAGUE' || l.includes('ENGLISH PREMIER')) && isCountry('England', 'Angleterre')) return 'PL';
    if ((l === 'CHAMPIONSHIP' || l === 'EFL CHAMPIONSHIP') && isCountry('England', 'Angleterre')) return 'ENG2';
    // Spain
    if ((l === 'LA LIGA' || l === 'LALIGA') && isCountry('Spain', 'Espagne')) return 'LA';
    if ((l === 'LA LIGA 2' || l === 'LALIGA 2' || l === 'SEGUNDA DIVISIÓN' || l === 'SEGUNDA DIVISION') && isCountry('Spain', 'Espagne')) return 'ESP2';
    // Italy
    if (l === 'SERIE A' && isCountry('Italy', 'Italie')) return 'SA';
    if (l === 'SERIE B' && isCountry('Italy', 'Italie')) return 'ITA2';
    // Germany
    if ((l === 'BUNDESLIGA' || l === '1. BUNDESLIGA') && isCountry('Germany', 'Allemagne')) return 'BL';
    if ((l === '2. BUNDESLIGA' || l === '2.BUNDESLIGA') && isCountry('Germany', 'Allemagne')) return 'GER2';
    // France — only if country explicitly says France
    if ((l === 'LIGUE 1' || l === 'LIGUE1') && isCountry('France')) return 'FL';
    if ((l === 'LIGUE 2' || l === 'LIGUE2') && isCountry('France')) return 'FRA2';
    // African "Ligue 1" — country-based disambiguation
    if ((l === 'LIGUE 1' || l === 'LIGUE1') && isCountry('Senegal', 'Sénégal')) return 'SN1';
    if ((l === 'LIGUE 1' || l === 'LIGUE1') && isCountry("Côte d'Ivoire", "Cote d'Ivoire", 'Ivory Coast')) return 'CI1';
    if ((l === 'LIGUE 1' || l === 'LIGUE1') && isCountry('Benin', 'Bénin')) return 'BJ1';

    // ── European competitions (no country guard needed) ──────────────────────
    if (l.includes('CHAMPIONS LEAGUE') || l.includes('UEFA CL') || l === 'UCL') return 'CL';
    if (l.includes('EUROPA LEAGUE') || l.includes('UEFA EL') || l === 'UEL') return 'EL';
    if (l.includes('CONFERENCE LEAGUE') || l === 'UECL') return 'ECL';

    // ── Other European leagues (unambiguous names) ───────────────────────────
    if (l === 'PRIMEIRA LIGA' || l === 'LIGA NOS' || l === 'LIGA PORTUGAL') return 'PT1';
    if (l === 'LIGA PORTUGAL 2' || l === 'SEGUNDA LIGA') return 'PT2';
    if (l === 'EREDIVISIE' || l === 'DUTCH EREDIVISIE') return 'NL1';
    if (l === 'EERSTE DIVISIE') return 'NL2';
    if (l === 'SCOTTISH PREMIERSHIP') return 'SC1';
    if (l === 'JUPILER PRO LEAGUE' || l === 'FIRST DIVISION A') return 'BE1';
    if (l === 'SUPER LIG' || l === 'SÜPER LIG') return 'TR1';
    // ── Americas ─────────────────────────────────────────────────────────────
    if (l === 'MLS' || l.includes('MAJOR LEAGUE SOCCER')) return 'US1';
    if (l === 'LIGA MX') return 'MX1';
    if (l.includes('BRASILEIRAO') || l.includes('CAMPEONATO BRASILEIRO') || l === 'SÉRIE A' || l === 'SERIE A BRASIL') return 'BR1';
    if (l === 'LIGA PROFESIONAL' || l.includes('PRIMERA DIVISIÓN ARGENTINA')) return 'AR1';
    // ── Africa ───────────────────────────────────────────────────────────────
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

  /** Filter matches by league codes */
  private filterByLeague(matches: RealMatch[], leagueCodes?: string[]): RealMatch[] {
    if (!leagueCodes || leagueCodes.length === 0) return matches;
    // Filtre strict sur leagueCode — pas de ré-inférence pour éviter les faux positifs
    // (ex : Bundesliga Autrichienne taggée 'TOP' ne doit PAS passer le filtre BL)
    return matches.filter((m) => leagueCodes.includes(m.leagueCode));
  }

  /**
   * Static league ID → display info map.
   * Replaces the broken /football-get-all-leagues API call (returns "status: failed" on free plan).
   * IDs verified from live API fixtures (2026-03-21).
   */
  private static readonly LEAGUE_ID_TO_INFO: Record<number, { name: string; country: string }> = {
    // ── Top 5 leagues (API-Football v3 IDs) ──────────────────────────────────
    39:  { name: 'Premier League',        country: 'Angleterre' },
    61:  { name: 'Ligue 1',              country: 'France' },
    78:  { name: 'Bundesliga',            country: 'Allemagne' },
    135: { name: 'Serie A',              country: 'Italie' },
    140: { name: 'La Liga',              country: 'Espagne' },
    // UEFA
    2:   { name: 'UEFA Champions League', country: 'Europe' },
    3:   { name: 'UEFA Europa League',    country: 'Europe' },
    848: { name: 'UEFA Conference League', country: 'Europe' },
    // England
    40:  { name: 'Championship',          country: 'Angleterre' },
    41:  { name: 'League One',            country: 'Angleterre' },
    42:  { name: 'League Two',            country: 'Angleterre' },
    9084:   { name: 'Premier League U21',country: 'Angleterre' },
    10068:  { name: 'Premier League U18',country: 'Angleterre' },
    9227:   { name: "Women's Super League", country: 'Angleterre' },
    // France (v3 IDs)
    62:   { name: 'Ligue 2',             country: 'France' },
    63:   { name: 'National',            country: 'France' },
    // Germany (v3 IDs)
    79:   { name: '2. Bundesliga',       country: 'Allemagne' },
    80:   { name: '3. Liga',             country: 'Allemagne' },
    81:   { name: 'DFB-Pokal',           country: 'Allemagne' },
    // Italy (v3 IDs)
    136:  { name: 'Serie B',             country: 'Italie' },
    137:  { name: 'Serie C',             country: 'Italie' },
    // Spain (v3 IDs)
    141:  { name: 'La Liga 2',           country: 'Espagne' },
    142:  { name: 'Primera Federación',  country: 'Espagne' },
    // Portugal (v3 IDs)
    94:   { name: 'Primeira Liga',       country: 'Portugal' },
    95:   { name: 'Liga Portugal 2',     country: 'Portugal' },
    // Netherlands (v3 IDs)
    88:   { name: 'Eredivisie',          country: 'Pays-Bas' },
    89:   { name: 'Eerste Divisie',      country: 'Pays-Bas' },
    // Scotland (v3 IDs)
    207:  { name: 'Scottish Premiership', country: 'Écosse' },
    208:  { name: 'Scottish Championship', country: 'Écosse' },
    209:  { name: 'Scottish League One',  country: 'Écosse' },
    210:  { name: 'Scottish League Two',  country: 'Écosse' },
    // Belgium (v3 IDs)
    144:  { name: 'Pro League',           country: 'Belgique' },
    // Switzerland
    900529: { name: 'Super League',      country: 'Suisse' },
    900530: { name: 'Challenge League',  country: 'Suisse' },
    // Austria (v3 IDs)
    218: { name: 'Bundesliga Autrichienne', country: 'Autriche' },
    219: { name: '2. Liga Autrichienne',    country: 'Autriche' },
    // Russia (v3 IDs)
    235: { name: 'Premier League Russe',    country: 'Russie' },
    236: { name: 'First League Russe',      country: 'Russie' },
    // Ukraine (v3 IDs)
    333: { name: 'Premier League Ukrainienne', country: 'Ukraine' },
    // Turkey (v3 IDs)
    197: { name: 'Super Lig',               country: 'Turquie' },
    198: { name: 'TFF 1. Lig',              country: 'Turquie' },
    // Norway
    59:    { name: 'Eliteserien',        country: 'Norvège' },
    // 333 is reserved for Ukrainian Premier League — Toppserien (W) has no confirmed v3 ID yet
    916229:{ name: 'Toppserien Féminin', country: 'Norvège' },
    921414:{ name: 'Toppserien 1 (W)',   country: 'Norvège' },
    // Denmark
    900339: { name: '1. Division',       country: 'Danemark' },
    900633: { name: '2. Division',       country: 'Danemark' },
    900634: { name: '3. Division',       country: 'Danemark' },
    916899: { name: 'Kvindeligaen (W)',  country: 'Danemark' },
    // Poland
    // 197 is reserved for Turkey Super Lig — 1. Liga (Poland) has no confirmed v3 ID yet
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
    346:    { name: '2. liga',           country: 'Tchéquie' },  // Czech 2. liga (API-Football ID 346)
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
    651:    { name: 'Superliga',         country: 'Kosovo' },  // Kosovo Superliga (API-Football ID 651)
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
    // Americas (v3 IDs)
    253: { name: 'MLS',                  country: 'États-Unis' },
    262: { name: 'Liga MX',              country: 'Mexique' },
    263: { name: 'Liga de Expansión MX', country: 'Mexique' },
    71:  { name: 'Brasileirão Serie A',  country: 'Brésil' },
    72:  { name: 'Brasileirão Serie B',  country: 'Brésil' },
    128: { name: 'Liga Profesional',     country: 'Argentine' },
    131: { name: 'Primera Nacional',     country: 'Argentine' },
    268: { name: 'Primera División',     country: 'Uruguay' },
    284: { name: 'Liga 1',               country: 'Pérou' },
    239: { name: 'Liga Betplay',         country: 'Colombie' },
    265: { name: 'Primera División',     country: 'Chili' },
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
    // ── Top 5 European leagues (API-Football v3 IDs) ─────────────────────────
    39:  'PL',   // Premier League (England)
    61:  'FL',   // Ligue 1 (France)
    78:  'BL',   // Bundesliga (Germany)
    135: 'SA',   // Serie A (Italy)
    140: 'LA',   // La Liga (Spain)
    // ── European 2nd tiers ──────────────────────────────────────────────────
    40:  'ENG2', // Championship
    41:  'ENG3', // League One
    42:  'ENG4', // League Two
    62:  'FRA2', // Ligue 2
    79:  'GER2', // 2. Bundesliga
    80:  'GER3', // 3. Liga
    136: 'ITA2', // Serie B
    141: 'ESP2', // La Liga 2
    // ── UEFA ────────────────────────────────────────────────────────────────
    2:   'CL',   // UEFA Champions League
    3:   'EL',   // UEFA Europa League
    848: 'ECL',  // UEFA Conference League
    // ── Other top leagues ───────────────────────────────────────────────────
    94:  'PT1',  // Primeira Liga (Portugal)
    88:  'NL1',  // Eredivisie (Netherlands)
    197: 'TR1',  // Super Lig (Turkey)
    144: 'BE1',  // Jupiler Pro League (Belgium)
    207: 'SC1',  // Scottish Premiership
    71:  'BR1',  // Brasileirão Serie A
    128: 'AR1',  // Argentine Primera División
    253: 'US1',  // MLS
    262: 'MX1',  // Liga MX
    // ── Explicit 'TOP' for leagues whose names trigger false positives ───────
    // (e.g. "Premier League" outside England, "Bundesliga" outside Germany)
    235: 'TOP',  // Russian Premier League
    333: 'TOP',  // Ukrainian Premier League
    218: 'TOP',  // Austrian Bundesliga
    219: 'TOP',  // Austrian 2. Liga
    683: 'TOP',  // Hong Kong Premier League
    702: 'TOP',  // Faroe Islands Premier League
    291: 'TOP',  // Kuwait Premier League
    // Youth / Women's — excluded from daily ticket
    528: 'TOP',  // EPL U21
    529: 'TOP',  // EPL U18
    // All other leagues → inferLeagueCode with country guard (see fetchFootballFromAPI)
  };

  /** Fallback: derive a proper display name+country from the inferred league code */
  private static readonly LEAGUE_CODE_TO_INFO: Record<string, { name: string; country: string }> = {
    PL:   { name: 'Premier League',            country: 'Angleterre' },
    LA:   { name: 'La Liga',                   country: 'Espagne' },
    SA:   { name: 'Serie A',                   country: 'Italie' },
    BL:   { name: 'Bundesliga',                country: 'Allemagne' },
    FL:   { name: 'Ligue 1',                   country: 'France' },
    CL:   { name: 'UEFA Champions League',     country: 'Europe' },
    EL:   { name: 'UEFA Europa League',        country: 'Europe' },
    ECL:  { name: 'UEFA Conference League',    country: 'Europe' },
    ENG2: { name: 'Championship',              country: 'Angleterre' },
    ENG3: { name: 'League One',               country: 'Angleterre' },
    ENG4: { name: 'League Two',               country: 'Angleterre' },
    ITA2: { name: 'Serie B',                   country: 'Italie' },
    GER2: { name: '2. Bundesliga',             country: 'Allemagne' },
    GER3: { name: '3. Liga',                   country: 'Allemagne' },
    FRA2: { name: 'Ligue 2',                   country: 'France' },
    ESP2: { name: 'La Liga 2',                 country: 'Espagne' },
    PT1:  { name: 'Primeira Liga',             country: 'Portugal' },
    PT2:  { name: 'Liga Portugal 2',           country: 'Portugal' },
    NL1:  { name: 'Eredivisie',                country: 'Pays-Bas' },
    NL2:  { name: 'Eerste Divisie',            country: 'Pays-Bas' },
    SC1:  { name: 'Scottish Premiership',      country: 'Écosse' },
    BE1:  { name: 'Pro League',                country: 'Belgique' },
    TR1:  { name: 'Süper Lig',                 country: 'Turquie' },
    US1:  { name: 'MLS',                       country: 'États-Unis' },
    BR1:  { name: 'Brasileirão',               country: 'Brésil' },
    MX1:  { name: 'Liga MX',                   country: 'Mexique' },
    AR1:  { name: 'Primera División',          country: 'Argentine' },
    SN1:  { name: 'Ligue 1 Sénégal',          country: 'Sénégal' },
    CI1:  { name: "Ligue 1 Côte d'Ivoire",    country: "Côte d'Ivoire" },
    BJ1:  { name: 'Championnat Bénin',         country: 'Bénin' },
  };

  /**
   * Fetch football fixtures for a specific date.
   * Primary source: The Odds API (h2h + totals + btts in one call).
   * API-Football is no longer used (account suspended).
   */
  private async fetchFootballFromAPI(date: string): Promise<RealMatch[]> {
    try {
      const { events, oddsMap } = await this.fetchOddsFromTheOddsAPI(date);

      if (events.length === 0) {
        console.warn(`[MatchService] The Odds API returned 0 events for ${date} — check THE_ODDS_API_KEY and credit balance.`);
        return [];
      }

      const matches = this.buildMatchesFromOddsEvents(events, oddsMap);
      console.log(`[MatchService] Built ${matches.length} fixtures from The Odds API for ${date}`);
      return matches;
    } catch (err) {
      console.error('[MatchService] fetchFootballFromAPI failed:', err);
      return [];
    }
  }

  private mapStatus(short: string): 'scheduled' | 'live' | 'finished' {
    if (['PST', 'NS', 'TBD'].includes(short)) return 'scheduled';
    if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
    return 'live';
  }

  // ── The Odds API integration ───────────────────────────────────────────────

  /** sport_key → league display info (used to build fixtures from API events) */
  private static readonly ODDS_SPORT_KEY_TO_LEAGUE: Record<string, { name: string; code: string; country: string }> = {
    'soccer_epl':                        { name: 'Premier League',         code: 'PL',  country: 'Angleterre' },
    'soccer_spain_la_liga':              { name: 'La Liga',                code: 'LA',  country: 'Espagne' },
    'soccer_italy_serie_a':              { name: 'Serie A',                code: 'SA',  country: 'Italie' },
    'soccer_germany_bundesliga':         { name: 'Bundesliga',             code: 'BL',  country: 'Allemagne' },
    'soccer_france_ligue_one':           { name: 'Ligue 1',                code: 'FL',  country: 'France' },
    'soccer_uefa_champs_league':         { name: 'UEFA Champions League',  code: 'CL',  country: 'Europe' },
    'soccer_europa_league':              { name: 'UEFA Europa League',     code: 'EL',  country: 'Europe' },
    'soccer_uefa_conference_league':     { name: 'UEFA Conference League', code: 'ECL', country: 'Europe' },
    'soccer_portugal_primeira_liga':     { name: 'Primeira Liga',          code: 'PT1', country: 'Portugal' },
    'soccer_netherlands_eredivisie':     { name: 'Eredivisie',             code: 'NL1', country: 'Pays-Bas' },
    'soccer_turkey_super_ligi':          { name: 'Süper Lig',              code: 'TR1', country: 'Turquie' },
    'soccer_belgium_first_div':          { name: 'Pro League',             code: 'BE1', country: 'Belgique' },
    'soccer_scotland_premiership':       { name: 'Scottish Premiership',   code: 'SC1', country: 'Écosse' },
    'soccer_brazil_campeonato':          { name: 'Brasileirão',            code: 'BR1', country: 'Brésil' },
    'soccer_mexico_ligamx':              { name: 'Liga MX',                code: 'MX1', country: 'Mexique' },
    'soccer_usa_mls':                    { name: 'MLS',                    code: 'US1', country: 'États-Unis' },
    'soccer_argentina_primera_division': { name: 'Primera División',       code: 'AR1', country: 'Argentine' },
  };

  /** All soccer sport keys to fetch (top-5 + UEFA + 10 autres compétitions) */
  private readonly ODDS_SPORT_KEYS = Object.keys(MatchService.ODDS_SPORT_KEY_TO_LEAGUE);

  /**
   * Fetch fixtures + full odds (h2h + Over/Under 2.5 + BTTS) from The Odds API.
   * Single call per sport_key — no extra credits vs h2h-only.
   * Returns raw events (for fixture building) + the extended odds map.
   * Cached in api_cache for 6 hours.
   */
  private async fetchOddsFromTheOddsAPI(date: string): Promise<{
    events: any[];
    oddsMap: Map<string, NonNullable<RealMatch['odds']>>;
  }> {
    const apiKey = process.env.THE_ODDS_API_KEY;
    const oddsMap = new Map<string, NonNullable<RealMatch['odds']>>();

    if (!apiKey) {
      console.warn('[OddsAPI] THE_ODDS_API_KEY not set — skipping real odds fetch.');
      return { events: [], oddsMap };
    }

    const supabase = createAdminClient();
    const cacheKey = `the-odds-api:soccer:full:${date}`;

    try {
      const { data: cached } = await supabase
        .from('api_cache')
        .select('data, fetched_at')
        .eq('cache_key', cacheKey)
        .single();

      if (cached) {
        const ageSeconds = (Date.now() - new Date(cached.fetched_at).getTime()) / 1000;
        if (ageSeconds < 21600) {
          const events = cached.data as any[];
          console.log(`[OddsAPI] Cache HIT for ${date} (${events.length} events)`);
          this.hydrateOddsMap(events, oddsMap);
          return { events, oddsMap };
        }
      }
    } catch { /* cache miss */ }

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const commenceTimeFrom = `${date}T00:00:00Z`;
    const commenceTimeTo = nextDay.toISOString().split('T')[0] + 'T00:00:00Z';

    console.log(`[OddsAPI] Fetching fixtures+odds for ${date} (${this.ODDS_SPORT_KEYS.length} competitions, markets: h2h+totals+btts)...`);

    const results = await Promise.allSettled(
      this.ODDS_SPORT_KEYS.map(async (sportKey) => {
        const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`);
        url.searchParams.set('apiKey', apiKey);
        url.searchParams.set('regions', 'eu');
        url.searchParams.set('markets', 'h2h,totals,btts');
        url.searchParams.set('oddsFormat', 'decimal');
        url.searchParams.set('dateFormat', 'iso');
        url.searchParams.set('commenceTimeFrom', commenceTimeFrom);
        url.searchParams.set('commenceTimeTo', commenceTimeTo);

        const res = await fetch(url.toString());
        if (!res.ok) {
          if (res.status !== 422) console.warn(`[OddsAPI] ${sportKey}: HTTP ${res.status}`);
          return [] as any[];
        }
        const remaining = res.headers.get('x-requests-remaining');
        if (remaining) console.log(`[OddsAPI] Credits remaining: ${remaining}`);
        return res.json() as Promise<any[]>;
      })
    );

    const allEvents: any[] = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);

    if (allEvents.length > 0) {
      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: allEvents,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'cache_key' });
    }

    this.hydrateOddsMap(allEvents, oddsMap);
    console.log(`[OddsAPI] ${oddsMap.size} matches with full odds loaded for ${date}.`);
    return { events: allEvents, oddsMap };
  }

  /**
   * Convert The Odds API events → RealMatch[].
   * Uses the sport_key to determine league name + code, and the
   * oddsMap (already averaged across bookmakers) for all odds fields.
   */
  private buildMatchesFromOddsEvents(
    events: any[],
    oddsMap: Map<string, NonNullable<RealMatch['odds']>>,
  ): RealMatch[] {
    const matches: RealMatch[] = [];

    for (const event of events) {
      const leagueInfo = MatchService.ODDS_SPORT_KEY_TO_LEAGUE[event.sport_key];
      if (!leagueInfo) continue; // unknown sport_key — skip

      const commence = new Date(event.commence_time);
      const eventDate = commence.toISOString().split('T')[0];
      const eventTime = commence.toISOString().substring(11, 16);

      const odds = this.lookupOdds(event.home_team, event.away_team, oddsMap) ?? undefined;

      matches.push({
        id: `odds-${event.id}`,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        league: leagueInfo.name,
        leagueCode: leagueInfo.code,
        country: leagueInfo.country,
        date: eventDate,
        time: eventTime,
        status: 'scheduled',
        sport: 'football',
        odds,
      });
    }

    return matches;
  }

  /** Populate oddsMap from a The Odds API event list (h2h + totals + btts) */
  private hydrateOddsMap(
    events: any[],
    oddsMap: Map<string, NonNullable<RealMatch['odds']>>,
  ): void {
    for (const event of events) {
      if (!event?.bookmakers?.length) continue;

      const acc: {
        home: number[]; draw: number[]; away: number[];
        over25: number[]; under25: number[];
        btts: number[]; bttsNo: number[];
      } = { home: [], draw: [], away: [], over25: [], under25: [], btts: [], bttsNo: [] };

      for (const bm of event.bookmakers) {
        // ── h2h (Match Winner) ─────────────────────────────────────────────
        const h2h = bm.markets?.find((m: any) => m.key === 'h2h');
        if (h2h?.outcomes) {
          for (const o of h2h.outcomes) {
            const price = Number(o.price);
            if (!price || price < 1) continue;
            if (o.name === event.home_team) acc.home.push(price);
            else if (o.name === event.away_team) acc.away.push(price);
            else acc.draw.push(price);
          }
        }

        // ── totals (Over/Under 2.5) ────────────────────────────────────────
        const totals = bm.markets?.find((m: any) => m.key === 'totals');
        if (totals?.outcomes) {
          for (const o of totals.outcomes) {
            const price = Number(o.price);
            const point = Number(o.point);
            if (!price || price < 1 || point !== 2.5) continue;
            if (o.name === 'Over')  acc.over25.push(price);
            if (o.name === 'Under') acc.under25.push(price);
          }
        }

        // ── btts (Both Teams To Score) ─────────────────────────────────────
        const bttsMarket = bm.markets?.find((m: any) => m.key === 'btts');
        if (bttsMarket?.outcomes) {
          for (const o of bttsMarket.outcomes) {
            const price = Number(o.price);
            if (!price || price < 1) continue;
            if (o.name === 'Yes') acc.btts.push(price);
            if (o.name === 'No')  acc.bttsNo.push(price);
          }
        }
      }

      const avg = (arr: number[]) =>
        arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;

      const homeOdd  = avg(acc.home);
      const awayOdd  = avg(acc.away);
      if (!homeOdd || !awayOdd) continue;

      const key = this.makeOddsKey(event.home_team, event.away_team);
      oddsMap.set(key, {
        home:     homeOdd,
        draw:     avg(acc.draw) || 3.2,
        away:     awayOdd,
        over25:   avg(acc.over25)  || undefined,
        under25:  avg(acc.under25) || undefined,
        btts:     avg(acc.btts)    || undefined,
        bttsNo:   avg(acc.bttsNo)  || undefined,
      });
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
    oddsMap: Map<string, NonNullable<RealMatch['odds']>>,
  ): NonNullable<RealMatch['odds']> | null {
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

}


export const matchService = new MatchService();
