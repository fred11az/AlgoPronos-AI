import { cachedFetch } from './api/footballApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamFormStats {
  form: string;           // e.g. "WWDLW" (last 5)
  goalsFor: number;       // average goals scored last 5
  goalsAgainst: number;   // average goals conceded last 5
  attackRating: string;   // percentage vs all teams (API-Football)
  defenseRating: string;
}

export interface H2HStats {
  homeWins: number;
  draws: number;
  awayWins: number;
  totalMatches: number;
  lastMatches: Array<{ homeGoals: number; awayGoals: number; winner: 'home' | 'away' | 'draw' }>;
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
  underOverAdvice: string | null; // e.g. "+2.5" or "-2.5"
  predictedWinner: string | null;
  // Team form (last 5 matches)
  homeForm: TeamFormStats | null;
  awayForm: TeamFormStats | null;
  // Head-to-Head history
  h2h: H2HStats | null;
  // Value bet calculation
  valueBetHome: number | null;
  valueBetAway: number | null;
  // Real odds from bookmaker (if fetched)
  realOdds: { home: number; draw: number; away: number } | null;
  // Additional market odds
  bttsOdds: number | null;       // Both Teams To Score: Yes
  bttsNoOdds: number | null;     // Both Teams To Score: No
  over25Odds: number | null;     // Over 2.5 goals
  under25Odds: number | null;    // Under 2.5 goals
  // Poisson-model probabilities for additional markets
  bttsProbability: number | null;   // % chance BTTS
  over25Probability: number | null; // % chance Over 2.5
  // Whether we got real data or not
  dataSource: 'api-football' | 'estimated';

  // Dixon-Coles parameters (Attack/Defense strength)
  homeAttack?: number;
  homeDefense?: number;
  awayAttack?: number;
  awayDefense?: number;
}

// ─── Poisson helpers ──────────────────────────────────────────────────────────

function poissonProb(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

/** P(Both teams score at least 1 goal) using Poisson */
function computeBttsProb(xgHome: number, xgAway: number): number {
  if (xgHome <= 0 || xgAway <= 0) return 0;
  const pHomeScores = 1 - poissonProb(xgHome, 0);
  const pAwayScores = 1 - poissonProb(xgAway, 0);
  return Math.round(pHomeScores * pAwayScores * 100);
}

/** P(Total goals > 2.5) using Poisson convolution */
function computeOver25Prob(xgHome: number, xgAway: number): number {
  if (xgHome <= 0 && xgAway <= 0) return 0;
  // P(total ≤ 2) = sum over h+a ≤ 2
  let probUnder = 0;
  for (let h = 0; h <= 2; h++) {
    for (let a = 0; a <= 2 - h; a++) {
      probUnder += poissonProb(xgHome, h) * poissonProb(xgAway, a);
    }
  }
  return Math.round((1 - probUnder) * 100);
}

// ─── Main stats fetcher ───────────────────────────────────────────────────────

export async function fetchMatchStats(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  currentOdds: { home: number; draw: number; away: number } | null,
  apiKey: string | undefined,
): Promise<MatchStats> {
  const base: MatchStats = {
    fixtureId: matchId,
    homeTeam,
    awayTeam,
    homePct: currentOdds ? Math.round((1 / currentOdds.home) * 100) : 33,
    drawPct: currentOdds ? Math.round((1 / currentOdds.draw) * 100) : 33,
    awayPct: currentOdds ? Math.round((1 / currentOdds.away) * 100) : 33,
    goalsHomeExpected: 0,
    goalsAwayExpected: 0,
    advice: '',
    underOverAdvice: null,
    predictedWinner: null,
    homeForm: null,
    awayForm: null,
    h2h: null,
    valueBetHome: null,
    valueBetAway: null,
    realOdds: null,
    bttsOdds: null,
    bttsNoOdds: null,
    over25Odds: null,
    under25Odds: null,
    bttsProbability: null,
    over25Probability: null,
    dataSource: 'estimated',
  };

  // Without API key or non-API-Football match, return odds-implied estimates
  if (!apiKey || !matchId.startsWith('apif-')) return base;

  const fixtureId = matchId.replace('apif-', '');

  try {
    // Fetch predictions + ALL odds bets in parallel (single odds call for all markets)
    const [predictionsData, oddsData] = await Promise.all([
      cachedFetch<any>(`/predictions`, { fixture: fixtureId }),
      // No `bet` filter → get all available bet types in one call
      cachedFetch<any>(`/odds`, { fixture: fixtureId, bookmaker: '8' }),
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
      base.underOverAdvice = p.under_over ?? null; // e.g. "+2.5" or "-2.5"
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
      if (base.homeForm) {
        base.homeAttack = Math.max(0.5, Math.min(2.5, base.homeForm.goalsFor / 1.35));
        base.homeDefense = Math.max(0.5, Math.min(2.5, base.homeForm.goalsAgainst / 1.35));
      }
      if (base.awayForm) {
        base.awayAttack = Math.max(0.5, Math.min(2.5, base.awayForm.goalsFor / 1.35));
        base.awayDefense = Math.max(0.5, Math.min(2.5, base.awayForm.goalsAgainst / 1.35));
      }

      // ── Parse H2H ─────────────────────────────────────────────────────────
      const h2hRaw: any[] = pred.h2h ?? [];
      if (h2hRaw.length > 0) {
        const last5 = h2hRaw.slice(0, 5);
        let homeWins = 0, draws = 0, awayWins = 0;
        const lastMatches: H2HStats['lastMatches'] = [];

        for (const match of last5) {
          const hg = match.goals?.home ?? 0;
          const ag = match.goals?.away ?? 0;
          const winner = hg > ag ? 'home' : ag > hg ? 'away' : 'draw';
          if (winner === 'home') homeWins++;
          else if (winner === 'away') awayWins++;
          else draws++;
          lastMatches.push({ homeGoals: hg, awayGoals: ag, winner });
        }

        base.h2h = { homeWins, draws, awayWins, totalMatches: last5.length, lastMatches };
      }

      base.dataSource = 'api-football';
    }

    // ── Parse odds (all bet types from bookmaker 8) ──────────────────────────
    const bets: any[] = oddsData?.response?.[0]?.bookmakers?.[0]?.bets ?? [];

    for (const bet of bets) {
      const values: any[] = bet.values ?? [];

      // bet.id === 1: Match Winner (1X2)
      if (bet.id === 1) {
        const home = values.find((v: any) => v.value === 'Home')?.odd;
        const draw = values.find((v: any) => v.value === 'Draw')?.odd;
        const away = values.find((v: any) => v.value === 'Away')?.odd;
        if (home && draw && away) {
          base.realOdds = {
            home: parseFloat(home),
            draw: parseFloat(draw),
            away: parseFloat(away),
          };
          const bookmakerHomePct = (1 / parseFloat(home)) * 100;
          const bookmakerAwayPct = (1 / parseFloat(away)) * 100;
          base.valueBetHome = Math.round((base.homePct - bookmakerHomePct) * 10) / 10;
          base.valueBetAway = Math.round((base.awayPct - bookmakerAwayPct) * 10) / 10;
        }
      }

      // bet.id === 5: Goals Over/Under
      if (bet.id === 5) {
        const over25 = values.find((v: any) => v.value === 'Over 2.5')?.odd;
        const under25 = values.find((v: any) => v.value === 'Under 2.5')?.odd;
        if (over25) base.over25Odds = parseFloat(over25);
        if (under25) base.under25Odds = parseFloat(under25);
      }

      // bet.id === 8: Both Teams Score
      if (bet.id === 8) {
        const yes = values.find((v: any) => v.value === 'Yes')?.odd;
        const no  = values.find((v: any) => v.value === 'No')?.odd;
        if (yes) base.bttsOdds   = parseFloat(yes);
        if (no)  base.bttsNoOdds = parseFloat(no);
      }
    }

    // ── Compute Poisson-based probabilities (if xG available) ───────────────
    if (base.goalsHomeExpected > 0 || base.goalsAwayExpected > 0) {
      base.bttsProbability  = computeBttsProb(base.goalsHomeExpected, base.goalsAwayExpected);
      base.over25Probability = computeOver25Prob(base.goalsHomeExpected, base.goalsAwayExpected);
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
    odds: { home: number; draw: number; away: number } | null;
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
    lines.push(`  Buts attendus (xG): ${stats.homeTeam} ${stats.goalsHomeExpected} — ${stats.awayTeam} ${stats.goalsAwayExpected} (total: ${totalExpected.toFixed(1)})`);
    if (stats.over25Probability !== null) {
      lines.push(`  → Over 2.5: ${stats.over25Probability}% (Poisson) | BTTS: ${stats.bttsProbability ?? '?'}% (Poisson)`);
    } else {
      lines.push(`  → Over 2.5: ${totalExpected > 2.5 ? 'PROBABLE' : 'IMPROBABLE'} | BTTS: ${stats.goalsHomeExpected > 0.7 && stats.goalsAwayExpected > 0.7 ? 'PROBABLE' : 'INCERTAIN'}`);
    }
  }

  if (stats.underOverAdvice) {
    lines.push(`  Conseil Over/Under API: "${stats.underOverAdvice}"`);
  }

  if (stats.advice) {
    lines.push(`  Conseil statistique: "${stats.advice}"`);
  }

  if (stats.predictedWinner) {
    lines.push(`  Vainqueur prédit: ${stats.predictedWinner}`);
  }

  if (stats.h2h && stats.h2h.totalMatches > 0) {
    const h = stats.h2h;
    lines.push(`  H2H (${h.totalMatches} derniers): ${stats.homeTeam} ${h.homeWins}V / ${h.draws}N / ${h.awayWins}V ${stats.awayTeam}`);
    const lastScores = h.lastMatches.map(m => `${m.homeGoals}-${m.awayGoals}`).join(', ');
    lines.push(`  Derniers scores H2H: ${lastScores}`);
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

  if (stats.over25Odds) lines.push(`  Cotes Over/Under 2.5: Over=${stats.over25Odds} | Under=${stats.under25Odds ?? '?'}`);
  if (stats.bttsOdds)   lines.push(`  Cotes BTTS: Oui=${stats.bttsOdds} | Non=${stats.bttsNoOdds ?? '?'}`);

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
