/**
 * Prediction Engine Orchestrator
 */

import { scoreMatrix, deriveOutcomeProbabilities } from './poissonBivariate';
import { computeLambdas, type ModelParams } from './teamStrength';
import { analyzeValue, type MarketOdds, type ValueAnalysis } from './valueBetting';

export interface PredictionInput {
  homeTeam: string;
  awayTeam: string;
  marketOdds: MarketOdds;
  modelParams: ModelParams;
}

export interface PredictionOutput {
  homeTeam: string;
  awayTeam: string;
  lambdas: { home: number; away: number };
  probabilities: { home: number; draw: number; away: number };
  topScores: Array<{ score: string; prob: number }>;
  valueAnalysis: ValueAnalysis[];
  bestBet: ValueAnalysis | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Prend un match, les paramètres du modèle, et sort une prédiction complète
 */
export function predict(input: PredictionInput): PredictionOutput {
  // 1. Calcul des espérances de buts
  const { lambdaHome, lambdaAway } = computeLambdas(
    input.homeTeam,
    input.awayTeam,
    input.modelParams
  );

  // 2. Génération de la matrice de scores Dixon-Coles
  const matrix = scoreMatrix(lambdaHome, lambdaAway, input.modelParams.rho);
  
  // 3. Extraction des probabilités 1N2
  const probabilities = deriveOutcomeProbabilities(matrix);

  // 4. Calcul des scores les plus probables
  const scores: Array<{ score: string; prob: number }> = [];
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      scores.push({ score: `${h}-${a}`, prob: matrix[h][a] });
    }
  }

  const topScores = scores
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 5)
    .map(s => ({ ...s, prob: Math.round(s.prob * 1000) / 10 }));

  // 5. Analyse de la valeur (Value Betting)
  const valueAnalysis = analyzeValue(probabilities, input.marketOdds);
  const bestBet = valueAnalysis[0] ?? null;

  // 6. Définition de la confiance
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    (bestBet?.valueEdge ?? 0) >= 15 ? 'HIGH' :
    (bestBet?.valueEdge ?? 0) >= 8 ? 'MEDIUM' : 'LOW';

  return {
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    lambdas: { 
      home: Math.round(lambdaHome * 100) / 100, 
      away: Math.round(lambdaAway * 100) / 100 
    },
    probabilities: {
      home: Math.round(probabilities.home * 1000) / 1000,
      draw: Math.round(probabilities.draw * 1000) / 1000,
      away: Math.round(probabilities.away * 1000) / 1000,
    },
    topScores,
    valueAnalysis,
    bestBet,
    confidence,
  };
}
