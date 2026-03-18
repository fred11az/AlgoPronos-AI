// API-Football statistics & predictions service
// Fetches real match stats for selected fixtures to power Groq analysis
// Free plan: 100 req/day — we call this ONLY for user-selected matches (3-5 max)

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamFormStats {
  form: string;           // e.g. "WWDLW" (last 5)
  goalsFor: number;       // average goals scored last 5
  goalsAgainst: number;   // average goals conceded last 5
  attackRating: string;   // percentage vs all teams (API-Football)
  defenseRating: string;
}

export interface MatchStats {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  // Win probabilities (from API-Football statistical model)
  homePct: number;        // e.g. 65
  drawPct: number;        // e.g. 20
  awayPct: number;        // e.g. 15
  // Expected goals
  goalsHomeExpected: number;   // e.g. 1.8
  goalsAwayExpected: number;   // e.g. 0.7
  // Recommendation
  advice: string;              // e.g. "Barcelona to win"
  predictedWinner: string | null;
  // Team form (last 5 matches)
  homeForm: TeamFormStats | null;
  awayForm: TeamFormStats | null;
  // Value bet calculation
  // valueBet = model_probability - bookmaker_implied_probability
  // Positive = value exists; > 0.07 = strong value
  valueBetHome: number | null;
  valueBetAway: number | null;
  // Real odds from bookmaker (if fetched)
  realOdds: { home: number; draw: number; away: number } | null;
  // Whether we got real data or not
  dataSource: 'api-football' | 'estimated';

  // Dixon-Coles parameters (Attack/Defense strength)
  homeAttack?: number;
  homeDefense?: number;
  awayAttack?: number;
  awayDefense?: number;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function apiFetch(endpoint: string, apiKey: string) {
  const response = await fetch(`${API_FOOTBALL_BASE}${endpoint}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`API-Football ${endpoint} → ${response.status}`);
  }
  return response.json();
}

// ─── Main stats fetcher ───────────────────────────────────────────────────────

export async function fetchMatchStats(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  currentOdds: { home: number; draw: number; away: number },
  apiKey: string | undefined,
): Promise<MatchStats> {
  const base: MatchStats = {
    fixtureId: matchId,
    homeTeam,
    awayTeam,
    homePct: Math.round((1 / currentOdds.home) * 100),
    drawPct: Math.round((1 / currentOdds.draw) * 100),
    awayPct: Math.round((1 / currentOdds.away) * 100),
    goalsHomeExpected: 0,
    goalsAwayExpected: 0,
    advice: '',
    predictedWinner: null,
    homeForm: null,
    awayForm: null,
    valueBetHome: null,
    valueBetAway: null,
    realOdds: null,
    dataSource: 'estimated',
  };

  // Without API key or non-API-Football match, return odds-implied estimates
  if (!apiKey || !matchId.startsWith('apif-')) return base;

  const fixtureId = matchId.replace('apif-', '');

  try {
    // Fetch predictions + real odds in parallel (2 requests per match)
    const [predictionsData, oddsData] = await Promise.all([
      apiFetch(`/predictions?fixture=${fixtureId}`, apiKey).catch(() => null),
      apiFetch(`/odds?fixture=${fixtureId}&bookmaker=8&bet=1`, apiKey).catch(() => null),
    ]);

    // ── Parse predictions ───────────────────────────────────────────────────
    const pred = predictionsData?.response?.[0];
    if (pred) {
      const p = pred.predictions;
      const comp = pred.comparison;

      base.homePct = parseInt(p.percent?.home ?? '0', 10) || base.homePct;
      base.drawPct = parseInt(p.percent?.draw ?? '0', 10) || base.drawPct;
      base.awayPct = parseInt(p.percent?.away ?? '0', 10) || base.awayPct;
      base.goalsHomeExpected = parseFloat(p.goals?.home ?? '0') || 0;
      base.goalsAwayExpected = parseFloat(p.goals?.away ?? '0') || 0;
      base.advice = p.advice ?? '';
      base.predictedWinner = pred.teams?.home?.winner ? homeTeam
        : pred.teams?.away?.winner ? awayTeam
        : null;

      // Team form from last 5
      const homeTeamData = pred.teams?.home?.last_5;
      const awayTeamData = pred.teams?.away?.last_5;

      if (homeTeamData) {
        base.homeForm = {
          form: homeTeamData.form ?? 'N/A',
          goalsFor: parseFloat(homeTeamData.goals?.for?.average ?? '0'),
          goalsAgainst: parseFloat(homeTeamData.goals?.against?.average ?? '0'),
          attackRating: comp?.att?.home ?? 'N/A',
          defenseRating: comp?.def?.home ?? 'N/A',
        };
      }
      if (awayTeamData) {
        base.awayForm = {
          form: awayTeamData.form ?? 'N/A',
          goalsFor: parseFloat(awayTeamData.goals?.for?.average ?? '0'),
          goalsAgainst: parseFloat(awayTeamData.goals?.against?.average ?? '0'),
          attackRating: comp?.att?.away ?? 'N/A',
          defenseRating: comp?.def?.away ?? 'N/A',
        };
      }

      // Compute Dixon-Coles style parameters (crude derivation from last 5)
      // Normalised against a league average of ~1.35 goals
      if (base.homeForm) {
        base.homeAttack = Math.max(0.5, Math.min(2.5, base.homeForm.goalsFor / 1.35));
        base.homeDefense = Math.max(0.5, Math.min(2.5, base.homeForm.goalsAgainst / 1.35));
      }
      if (base.awayForm) {
        base.awayAttack = Math.max(0.5, Math.min(2.5, base.awayForm.goalsFor / 1.35));
        base.awayDefense = Math.max(0.5, Math.min(2.5, base.awayForm.goalsAgainst / 1.35));
      }

      base.dataSource = 'api-football';
    }

    // ── Parse real odds (Bet365 bookmaker=8, bet=1 = Match Winner) ──────────
    const oddsResp = oddsData?.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;
    if (oddsResp && Array.isArray(oddsResp)) {
      const home = oddsResp.find((v: { value: string }) => v.value === 'Home')?.odd;
      const draw = oddsResp.find((v: { value: string }) => v.value === 'Draw')?.odd;
      const away = oddsResp.find((v: { value: string }) => v.value === 'Away')?.odd;

      if (home && draw && away) {
        base.realOdds = {
          home: parseFloat(home),
          draw: parseFloat(draw),
          away: parseFloat(away),
        };

        // Value bet: model_probability - bookmaker_implied_probability
        // (positive = value exists, > 0.07 = strong value)
        const bookmakerHomePct = (1 / parseFloat(home)) * 100;
        const bookmakerAwayPct = (1 / parseFloat(away)) * 100;
        base.valueBetHome = Math.round((base.homePct - bookmakerHomePct) * 10) / 10;
        base.valueBetAway = Math.round((base.awayPct - bookmakerAwayPct) * 10) / 10;
      }
    }
  } catch (err) {
    console.error(`[stats-service] Failed to fetch stats for fixture ${fixtureId}:`, err);
    // Return base (odds-implied estimates) on error
  }

  return base;
}

// ─── Batch fetcher for selected matches ───────────────────────────────────────

export async function fetchStatsForMatches(
  matches: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    odds: { home: number; draw: number; away: number };
  }[],
  apiKey: string | undefined,
): Promise<Map<string, MatchStats>> {
  const results = new Map<string, MatchStats>();

  // Fetch in parallel (max 5 matches = 10 API requests, within free plan)
  const statsArray = await Promise.all(
    matches.map(m => fetchMatchStats(m.id, m.homeTeam, m.awayTeam, m.odds, apiKey))
  );

  for (const stats of statsArray) {
    results.set(stats.fixtureId, stats);
  }

  return results;
}

// ─── Format stats for prompt ──────────────────────────────────────────────────

export function formatStatsForPrompt(stats: MatchStats): string {
  const effectiveOdds = stats.realOdds ?? null;
  const source = stats.dataSource === 'api-football'
    ? 'Données réelles API-Football'
    : 'Estimé depuis les cotes (pas de clé API ou match hors API-Football)';

  const lines: string[] = [
    `  [Source: ${source}]`,
    `  Probabilités statistiques: Domicile ${stats.homePct}% | Nul ${stats.drawPct}% | Extérieur ${stats.awayPct}%`,
  ];

  if (stats.goalsHomeExpected > 0 || stats.goalsAwayExpected > 0) {
    const totalExpected = stats.goalsHomeExpected + stats.goalsAwayExpected;
    lines.push(`  Buts attendus: ${stats.homeTeam} ${stats.goalsHomeExpected} — ${stats.awayTeam} ${stats.goalsAwayExpected} (total: ${totalExpected.toFixed(1)})`);
    lines.push(`  → Over 2.5: ${totalExpected > 2.5 ? 'PROBABLE' : 'IMPROBABLE'} | BTTS: ${stats.goalsHomeExpected > 0.7 && stats.goalsAwayExpected > 0.7 ? 'PROBABLE' : 'INCERTAIN'}`);
  }

  if (stats.advice) {
    lines.push(`  Conseil statistique: "${stats.advice}"`);
  }

  if (stats.predictedWinner) {
    lines.push(`  Vainqueur prédit: ${stats.predictedWinner}`);
  }

  if (stats.homeForm) {
    lines.push(`  Forme ${stats.homeTeam} (5 derniers): ${stats.homeForm.form} | Buts marqués moy: ${stats.homeForm.goalsFor} | Buts encaissés moy: ${stats.homeForm.goalsAgainst}`);
  }

  if (stats.awayForm) {
    lines.push(`  Forme ${stats.awayTeam} (5 derniers): ${stats.awayForm.form} | Buts marqués moy: ${stats.awayForm.goalsFor} | Buts encaissés moy: ${stats.awayForm.goalsAgainst}`);
  }

  if (effectiveOdds) {
    lines.push(`  Cotes réelles Bet365: 1=${effectiveOdds.home} | X=${effectiveOdds.draw} | 2=${effectiveOdds.away}`);
  }

  if (stats.valueBetHome !== null && stats.valueBetAway !== null) {
    const homeValue = stats.valueBetHome > 0
      ? `+${stats.valueBetHome}% (VALUE BET${stats.valueBetHome > 7 ? ' FORT' : ''})`
      : `${stats.valueBetHome}% (pas de valeur)`;
    const awayValue = stats.valueBetAway > 0
      ? `+${stats.valueBetAway}% (VALUE BET${stats.valueBetAway > 7 ? ' FORT' : ''})`
      : `${stats.valueBetAway}% (pas de valeur)`;
    lines.push(`  Value bet domicile: ${homeValue}`);
    lines.push(`  Value bet extérieur: ${awayValue}`);
  }

  return lines.join('\n');
}
