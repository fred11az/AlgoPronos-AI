import { slugify } from '../utils/slugify';

export interface OpenClawPrediction {
  slug: string;
  home_team: string;
  away_team: string;
  home_team_slug: string;
  away_team_slug: string;
  league: string;
  league_code: string;
  league_slug: string;
  match_date: string;
  match_time: string;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  prediction: string;
  prediction_type: 'home' | 'draw' | 'away' | 'btts' | 'over25';
  probability: number;
  implied_probability: number;
  value_edge: number;
  recommended_odds: number;
  ai_analysis: string;
  home_form: string;
  away_form: string;
  expires_at: string;
}

export async function generatePrediction(
  match: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    leagueCode: string;
    date: string;
    time: string;
    odds: { home: number; draw: number; away: number };
  }
): Promise<OpenClawPrediction | null> {
  const url = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18790/v1/chat/completions';
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;

  const systemPrompt = `Tu es AlgoPronos AI, expert en analyse de football et paris sportifs.
RÈGLES:
- Génère une analyse journalistique de 3-4 phrases en Français.
- Détermine la probabilité (0-100) pour le résultat le plus probable.
- Formate le résultat en JSON uniquement.
- prediction_type doit être: home, draw, away, btts, ou over25.
- home_form et away_form doivent être une chaîne de 5 caractères comme "WDWLL" (W=Victoire, D=Nul, L=Défaite).`;

  const userPrompt = `Analyse ce match: ${match.homeTeam} vs ${match.awayTeam} (${match.league}) le ${match.date} à ${match.time}.
${match.odds.home > 0 ? `Cotes réelles: 1=${match.odds.home}, N=${match.odds.draw}, 2=${match.odds.away}` : 'Cotes non fournies, merci de les estimer/rechercher.'}

Réponds avec ce JSON exact:
{
  "prediction": "Libellé court du pronostic",
  "prediction_type": "home|draw|away|btts|over25",
  "probability": 65,
  "odds": { "home": 1.8, "draw": 3.4, "away": 4.5 },
  "ai_analysis": "Ton analyse journalistique ici...",
  "home_form": "WWDLW",
  "away_form": "LLDWW"
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI search

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[OpenClaw] API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices[0]?.message?.content || '';
    
    const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const homeSlug = slugify(match.homeTeam);
    const awaySlug = slugify(match.awayTeam);
    const slug = `${homeSlug}-vs-${awaySlug}-${match.date}`;
    const leagueSlug = slugify(match.league);
    
    const finalOdds = match.odds.home > 0 ? match.odds : (parsed.odds || { home: 1.9, draw: 3.3, away: 3.8 });
    const recommended_odds = finalOdds[parsed.prediction_type === 'home' ? 'home' : parsed.prediction_type === 'away' ? 'away' : 'draw'] || 2.0;
    
    const implied = Math.round((1 / recommended_odds) * 100);
    const valueEdge = Math.round((parsed.probability - implied) * 10) / 10;
    
    return {
      slug,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      home_team_slug: homeSlug,
      away_team_slug: awaySlug,
      league: match.league,
      league_code: match.leagueCode,
      league_slug: leagueSlug,
      match_date: match.date,
      match_time: match.time,
      odds_home: finalOdds.home,
      odds_draw: finalOdds.draw,
      odds_away: finalOdds.away,
      prediction: parsed.prediction,
      prediction_type: parsed.prediction_type,
      probability: parsed.probability,
      implied_probability: implied,
      value_edge: valueEdge,
      recommended_odds,
      ai_analysis: parsed.ai_analysis,
      home_form: parsed.home_form,
      away_form: parsed.away_form,
      expires_at: new Date(new Date(match.date).getTime() + 2 * 86400000).toISOString(),
    };
  } catch (err) {
    console.error('[OpenClaw] generation error:', err);
    return null;
  }
}
