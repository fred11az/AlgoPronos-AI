/**
 * Dixon-Coles MLE (Maximum Likelihood Estimation)
 */
import { createClient } from '@supabase/supabase-js';
import { poissonProb, tauCorrection } from './poissonBivariate';
import type { ModelParams, TeamParams } from './teamStrength';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Fetches optimized parameters from Supabase if available.
 */
export async function fetchModelParams(teamNames: string[]): Promise<Record<string, TeamParams>> {
  const strengths: Record<string, TeamParams> = {};
  
  try {
    const { data, error } = await supabase
      .from('model_params')
      .select('team_id, attack, defense')
      .in('team_id', teamNames);

    if (data && !error) {
      data.forEach(row => {
        strengths[row.team_id] = { 
          attack: parseFloat(row.attack), 
          defense: parseFloat(row.defense) 
        };
      });
    }
  } catch (err) {
    console.error('[dixon-coles] Failed to fetch params:', err);
  }

  return strengths;
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  date: Date;
}

/**
 * Facteur de décroissance temporelle (Time Decay)
 * Les matchs récents pèsent plus lourd que les anciens.
 */
function calculateTimeWeight(matchDate: Date, xi: number = 0.0065): number {
  const daysAgo = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-xi * Math.max(0, daysAgo));
}

/**
 * Calcul de log-vraisemblance pour un match
 */
function calculateMatchLogLikelihood(
  result: MatchResult,
  params: ModelParams,
  leagueAvg: number
): number {
  const home = params.teams[result.homeTeam] || { attack: 1.0, defense: 1.0 };
  const away = params.teams[result.awayTeam] || { attack: 1.0, defense: 1.0 };

  const lambdaHome = home.attack * away.defense * params.homeAdvantage * leagueAvg;
  const lambdaAway = away.attack * home.defense * leagueAvg;

  const tau = tauCorrection(result.homeGoals, result.awayGoals, lambdaHome, lambdaAway, params.rho);

  const pHome = poissonProb(lambdaHome, result.homeGoals);
  const pAway = poissonProb(lambdaAway, result.awayGoals);

  // Avoid log(0)
  const logL =
    Math.log(Math.max(tau, 1e-10)) +
    Math.log(Math.max(pHome, 1e-10)) +
    Math.log(Math.max(pAway, 1e-10));

  return logL;
}

/**
 * Initialisation des paramètres par défaut
 */
export function initializeParams(teamNames: string[]): ModelParams {
  const teams: Record<string, TeamParams> = {};
  teamNames.forEach(name => {
    teams[name] = { attack: 1.0, defense: 1.0 };
  });

  return {
    teams,
    homeAdvantage: 1.25,
    rho: -0.1,
  };
}

/**
 * Calcul du score de vraisemblance total pour un set de matchs
 */
export function calculateTotalLogLikelihood(
  results: MatchResult[],
  params: ModelParams,
  leagueAvg: number = 1.35
): number {
  return results.reduce((sum, r) => {
    const w = calculateTimeWeight(r.date);
    return sum + w * calculateMatchLogLikelihood(r, params, leagueAvg);
  }, 0);
}
