/**
 * Tracking Service: Logs predictions to Supabase for ROI calculation.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PredictionLogEntry {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  market: 'home' | 'draw' | 'away';
  modelProb: number;
  bookmakerOdds: number;
  valueEdge: number;
}

/**
 * Logs a prediction to the database.
 */
export async function logPrediction(entry: PredictionLogEntry) {
  try {
    const { error } = await supabase.from('predictions_log').upsert({
      match_id: entry.matchId,
      home_team: entry.homeTeam,
      away_team: entry.awayTeam,
      market: entry.market,
      model_prob: entry.modelProb,
      bookmaker_odds: entry.bookmakerOdds,
      value_edge: entry.valueEdge,
      created_at: new Date().toISOString()
    }, { onConflict: 'match_id,market' });

    if (error) {
      console.error(`[prediction-tracking] Failed to log prediction for ${entry.matchId}:`, error.message);
    }
  } catch (err) {
    console.error(`[prediction-tracking] Error logging prediction:`, err);
  }
}

/**
 * Resolves a prediction with a result.
 * @param matchId The external fixture ID
 * @param result 'WIN' | 'LOSS'
 */
export async function resolvePrediction(matchId: string, result: 'WIN' | 'LOSS') {
  try {
    const { error } = await supabase
      .from('predictions_log')
      .update({ 
        result, 
        resolved_at: new Date().toISOString() 
      })
      .eq('match_id', matchId);

    if (error) {
      console.error(`[prediction-tracking] Failed to resolve prediction for ${matchId}:`, error.message);
    }
  } catch (err) {
    console.error(`[prediction-tracking] Error resolving prediction:`, err);
  }
}
