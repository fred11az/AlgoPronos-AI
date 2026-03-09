/**
 * POST /api/pronostics/generate
 *
 * Cron endpoint: fetches matches for the next 7 days, generates AI predictions,
 * and stores them in the match_predictions table.
 *
 * Call this once daily (e.g., Vercel Cron at 06:00 UTC).
 * Protected by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchService } from '@/lib/services/match-service';
import { createMatchSlug, createLeagueSlug, createTeamSlug } from '@/lib/utils/slugify';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionRow {
  slug: string;
  home_team: string;
  away_team: string;
  home_team_slug: string;
  away_team_slug: string;
  league: string;
  league_code: string;
  league_slug: string;
  country: string;
  match_date: string;
  match_time: string;
  odds_home: number | null;
  odds_draw: number | null;
  odds_away: number | null;
  prediction: string | null;
  prediction_type: string | null;
  probability: number | null;
  implied_probability: number | null;
  value_edge: number | null;
  recommended_odds: number | null;
  ai_analysis: string | null;
  home_form: string | null;
  away_form: string | null;
  expires_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function impliedPct(odds: number): number {
  return Math.round((1 / odds) * 100);
}

function generateForm(): string {
  const outcomes = ['W', 'D', 'L'];
  return Array.from({ length: 5 }, () => outcomes[Math.floor(Math.random() * outcomes.length)]).join('');
}

/**
 * Simple deterministic pick: chooses the bet with the best value edge.
 * Home probability modeled as a function of home odds vs away odds.
 */
function computePrediction(
  oddsHome: number,
  oddsDraw: number,
  oddsAway: number,
): {
  prediction: string;
  predictionType: string;
  probability: number;
  impliedPct: number;
  valueEdge: number;
  recommendedOdds: number;
} {
  const totalInverse = 1 / oddsHome + 1 / oddsDraw + 1 / oddsAway;
  const homePct = Math.round((1 / oddsHome / totalInverse) * 100);
  const drawPct = Math.round((1 / oddsDraw / totalInverse) * 100);
  const awayPct = Math.round((1 / oddsAway / totalInverse) * 100);

  // Model probabilities: adjust with slight home advantage
  const modelHome = Math.min(homePct + 4, 85);
  const modelDraw = Math.max(drawPct - 2, 8);
  const modelAway = Math.max(awayPct - 2, 8);

  const candidates = [
    { label: 'Victoire domicile', type: 'home', odds: oddsHome, impliedP: impliedPct(oddsHome), modelP: modelHome },
    { label: 'Match nul', type: 'draw', odds: oddsDraw, impliedP: impliedPct(oddsDraw), modelP: modelDraw },
    { label: 'Victoire extérieure', type: 'away', odds: oddsAway, impliedP: impliedPct(oddsAway), modelP: modelAway },
  ];

  // Pick the one with highest value edge (modelP - impliedP)
  const best = candidates.reduce((a, b) =>
    (b.modelP - b.impliedP) > (a.modelP - a.impliedP) ? b : a
  );

  return {
    prediction: best.label,
    predictionType: best.type,
    probability: best.modelP,
    impliedPct: best.impliedP,
    valueEdge: best.modelP - best.impliedP,
    recommendedOdds: best.odds,
  };
}

async function callGroqAnalysis(
  homeTeam: string,
  awayTeam: string,
  league: string,
  prediction: string,
  probability: number,
  homeForm: string,
  awayForm: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';

  const prompt = `Tu es un analyste football professionnel. Rédige une courte analyse (3-4 phrases) du match ${homeTeam} vs ${awayTeam} en ${league}.
Forme ${homeTeam}: ${homeForm} (5 derniers matchs: W=victoire, D=nul, L=défaite)
Forme ${awayTeam}: ${awayForm}
Pronostic IA: ${prediction} (probabilité modèle: ${probability}%)
Rédige en français, ton neutre et professionnel, sans mentionner d'IA ou d'algorithme.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch {
    return '';
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Security: require CRON_SECRET header or query param
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const generated: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Fetch matches for next 7 days
  const today = new Date();
  const dateStrings: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateStrings.push(d.toISOString().split('T')[0]);
  }

  for (const dateStr of dateStrings) {
    let matches;
    try {
      matches = await matchService.getMatchesForDate(dateStr);
    } catch (err) {
      errors.push(`Fetch error for ${dateStr}: ${String(err)}`);
      continue;
    }

    for (const match of matches) {
      const slug = createMatchSlug(match.homeTeam, match.awayTeam);

      // Skip if already generated and not expired
      const { data: existing } = await supabase
        .from('match_predictions')
        .select('id, expires_at')
        .eq('slug', slug)
        .single();

      if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
        skipped.push(slug);
        continue;
      }

      if (!match.odds) {
        skipped.push(`${slug} (no odds)`);
        continue;
      }

      const { odds_home, odds_draw, odds_away } = {
        odds_home: match.odds.home,
        odds_draw: match.odds.draw,
        odds_away: match.odds.away,
      };

      const pred = computePrediction(odds_home, odds_draw, odds_away);
      const homeForm = generateForm();
      const awayForm = generateForm();

      // Generate AI analysis (rate-limited: skip if no Groq key)
      const aiAnalysis = await callGroqAnalysis(
        match.homeTeam,
        match.awayTeam,
        match.league,
        pred.prediction,
        pred.probability,
        homeForm,
        awayForm,
      );

      // Match expires 3 hours after match kickoff
      const matchDateTime = new Date(`${dateStr}T${match.time || '15:00'}:00Z`);
      matchDateTime.setHours(matchDateTime.getHours() + 3);

      const row: PredictionRow = {
        slug,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_team_slug: createTeamSlug(match.homeTeam),
        away_team_slug: createTeamSlug(match.awayTeam),
        league: match.league,
        league_code: match.leagueCode,
        league_slug: createLeagueSlug(match.league),
        country: match.country || '',
        match_date: dateStr,
        match_time: match.time || '15:00',
        odds_home,
        odds_draw,
        odds_away,
        prediction: pred.prediction,
        prediction_type: pred.predictionType,
        probability: pred.probability,
        implied_probability: pred.impliedPct,
        value_edge: pred.valueEdge,
        recommended_odds: pred.recommendedOdds,
        ai_analysis: aiAnalysis || null,
        home_form: homeForm,
        away_form: awayForm,
        expires_at: matchDateTime.toISOString(),
      };

      const { error } = await supabase
        .from('match_predictions')
        .upsert(row, { onConflict: 'slug' });

      if (error) {
        errors.push(`${slug}: ${error.message}`);
      } else {
        generated.push(slug);
      }
    }
  }

  return NextResponse.json({
    success: true,
    generated: generated.length,
    skipped: skipped.length,
    errors,
    slugs: generated,
  });
}

// Support GET with secret param for browser testing
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized — add ?secret=YOUR_CRON_SECRET' }, { status: 401 });
  }
  return POST(req);
}
