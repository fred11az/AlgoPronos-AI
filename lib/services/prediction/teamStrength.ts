/**
 * Team Strength & Lambda Calculations
 */

export interface TeamParams {
  attack: number;   // > 1 = strong, < 1 = weak
  defense: number;  // < 1 = solid, > 1 = porous
}

export interface ModelParams {
  teams: Record<string, TeamParams>;
  homeAdvantage: number; // e.g. 1.25
  rho: number;           // Dixon-Coles corection factor
}

/**
 * Calcule les espérances de buts (lambdas) pour un match donné.
 * λ_home = attack_home * defense_away * homeAdvantage * leagueAvgGoals
 * λ_away = attack_away * defense_home * leagueAvgGoals
 */
export function computeLambdas(
  homeTeam: string,
  awayTeam: string,
  params: ModelParams,
  leagueAvgGoals: number = 1.35
): { lambdaHome: number; lambdaAway: number } {
  // Fallback to neutral if team not found
  const home = params.teams[homeTeam] || { attack: 1.0, defense: 1.0 };
  const away = params.teams[awayTeam] || { attack: 1.0, defense: 1.0 };

  return {
    lambdaHome: home.attack * away.defense * params.homeAdvantage * leagueAvgGoals,
    lambdaAway: away.attack * home.defense * leagueAvgGoals,
  };
}
