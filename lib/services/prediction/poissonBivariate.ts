/**
 * Bivariate Poisson Distribution & Dixon-Coles Correction
 */

// Probabilité de Poisson : P(X = k) = (λ^k × e^-λ) / k!
export function poissonProb(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = k * Math.log(lambda) - lambda;
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

/**
 * Correction Dixon-Coles pour les scores bas (0-0, 1-0, 0-1, 1-1)
 * Ces scores sont souvent mal estimés par une distribution de Poisson simple.
 * @param rho Paramètre de corrélation (typiquement -0.1)
 */
export function tauCorrection(
  x: number, 
  y: number,
  lambdaHome: number, 
  lambdaAway: number,
  rho: number = -0.1
): number {
  if (x === 0 && y === 0) return 1 - (lambdaHome * lambdaAway * rho);
  if (x === 1 && y === 0) return 1 + (lambdaAway * rho);
  if (x === 0 && y === 1) return 1 + (lambdaHome * rho);
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

/**
 * Génère une matrice de probabilité pour tous les scores possibles (h-a)
 */
export function scoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  rho: number = -0.1,
  maxGoals: number = 8
): number[][] {
  const matrix: number[][] = [];
  let total = 0;

  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p =
        poissonProb(lambdaHome, h) *
        poissonProb(lambdaAway, a) *
        tauCorrection(h, a, lambdaHome, lambdaAway, rho);
      matrix[h][a] = p;
      total += p;
    }
  }

  // Normalisation pour s'assurer que la somme est 1
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] /= total;
    }
  }

  return matrix;
}

/**
 * Dérive les probabilités 1N2 (Win/Draw/Loss) depuis la matrice des scores
 */
export function deriveOutcomeProbabilities(matrix: number[][]): {
  home: number; draw: number; away: number;
} {
  let home = 0, draw = 0, away = 0;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      if (h > a) home += matrix[h][a];
      else if (h === a) draw += matrix[h][a];
      else away += matrix[h][a];
    }
  }
  return { home, draw, away };
}
