/**
 * Value Betting & Kelly Criterion Logic
 */

export interface MarketOdds {
  home: number;  // e.g. 2.10
  draw: number;  // e.g. 3.40
  away: number;  // e.g. 3.20
}

export interface ValueAnalysis {
  market: 'home' | 'draw' | 'away';
  modelProb: number;        // probability calculated by our Dixon-Coles model
  impliedProb: number;      // raw bookmaker probability (including margin)
  bookmakerOdds: number;    
  fairOdds: number;         // 1 / modelProb
  valueEdge: number;        // Edge in %
  kellyFraction: number;    // Recommended Kelly stake
  recommendation: 'STRONG BUY' | 'BUY' | 'SKIP';
}

/**
 * Convertir les cotes en probabilités implicites nettes (marge retirée)
 */
export function removeMargin(odds: MarketOdds): {
  home: number; draw: number; away: number;
} {
  const raw = {
    home: 1 / odds.home,
    draw: 1 / odds.draw,
    away: 1 / odds.away,
  };
  const margin = raw.home + raw.draw + raw.away;
  return {
    home: raw.home / margin,
    draw: raw.draw / margin,
    away: raw.away / margin,
  };
}

/**
 * Critère de Kelly pour la gestion de bankroll
 */
function calculateKelly(modelProb: number, odds: number): number {
  const b = odds - 1;
  const q = 1 - modelProb;
  const kelly = (b * modelProb - q) / b;
  // Fractional Kelly (25%) pour plus de sécurité
  return Math.max(0, kelly * 0.25);
}

/**
 * Analyse la valeur d'un pari en comparant modèle vs marché
 */
export function analyzeValue(
  modelProbabilities: { home: number; draw: number; away: number },
  marketOdds: MarketOdds,
  minEdge: number = 0.05
): ValueAnalysis[] {
  const implied = removeMargin(marketOdds);
  const markets: Array<'home' | 'draw' | 'away'> = ['home', 'draw', 'away'];

  return markets
    .map(market => {
      const modelProb = modelProbabilities[market];
      const impliedProb = implied[market];
      const bookOdds = marketOdds[market];
      
      const valueEdge = (modelProb - impliedProb) / impliedProb;
      const fairOdds = 1 / modelProb;
      const kelly = calculateKelly(modelProb, bookOdds);

      return {
        market,
        modelProb,
        impliedProb,
        bookmakerOdds: bookOdds,
        fairOdds: Math.round(fairOdds * 100) / 100,
        valueEdge: Math.round(valueEdge * 1000) / 10,
        kellyFraction: Math.round(kelly * 1000) / 10,
        recommendation: (
          valueEdge >= 0.15 ? 'STRONG BUY' :
          valueEdge >= minEdge ? 'BUY' : 'SKIP'
        ) as 'STRONG BUY' | 'BUY' | 'SKIP',
      };
    })
    .filter(v => v.valueEdge > 0)
    .sort((a, b) => b.valueEdge - a.valueEdge);
}
