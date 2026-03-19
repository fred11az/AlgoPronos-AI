/**
 * POST /api/weekly/generate
 *
 * Cron endpoint: every Sunday at 20:00 UTC.
 * Reads match_predictions for the upcoming week, selects top matches
 * (Champions League, Europa League, Top 5 leagues), generates deep AI
 * editorial analysis, and stores in weekly_spotlights.
 *
 * Protected by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ─── Constants ────────────────────────────────────────────────────────────────

// Priority leagues for spotlight selection
const PRIORITY_LEAGUES = ['CL', 'EL', 'ECL', 'PL', 'LA', 'SA', 'BL', 'FL', 'PT1'];

// Max featured matches in the spotlight
const MAX_KEY_MATCHES = 6;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PredictionRow {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  league_code: string;
  league_slug: string;
  country: string;
  match_date: string;
  match_time: string;
  prediction: string;
  prediction_type: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  ai_analysis: string | null;
}

interface KeyMatch {
  slug: string;
  home_team: string;
  away_team: string;
  league: string;
  league_slug: string;
  country: string;
  match_date: string;
  match_time: string;
  prediction: string;
  prediction_type: string;
  probability: number;
  recommended_odds: number;
  value_edge: number;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  deep_analysis: string;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

async function callGemini(prompt: string, temperature = 0.7, maxTokens = 350): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
}

async function generateWeeklyIntro(
  keyMatches: KeyMatch[],
  weekLabel: string,
): Promise<string> {
  const matchList = keyMatches
    .map((m) => `- ${m.home_team} vs ${m.away_team} (${m.league}, ${m.match_date})`)
    .join('\n');

  const prompt = `Tu es un rédacteur sportif football. Rédige une introduction éditoriale (2 paragraphes, 5-6 phrases au total) pour présenter les grandes affiches football de la semaine du ${weekLabel}.

Matchs à la une :
${matchList}

Style : passionné, professionnel, en français. Pas de listes, juste du texte fluide. Mets en avant les enjeux et les confrontations les plus attendues. Ne mentionne pas d'IA ou d'algorithme.`;

  return (await callGemini(prompt, 0.7, 350)) || `Sélection des grandes affiches pour la semaine du ${weekLabel}.`;
}

async function generateDeepAnalysis(match: PredictionRow): Promise<string> {
  const prompt = `Tu es un analyste football expert. Rédige une analyse approfondie (5-6 phrases) du match ${match.home_team} vs ${match.away_team} en ${match.league}.
Cotes : 1=${match.odds_home} / N=${match.odds_draw} / 2=${match.odds_away}
Pronostic algorithme : ${match.prediction} (probabilité : ${match.probability}%, value edge : +${match.value_edge}%)
Analyse en français, ton professionnel. Couvre les enjeux du match, les forces/faiblesses des équipes, et justifie le pronostic. Sans mentionner IA ou algorithme.`;

  return (await callGemini(prompt, 0.6, 300)) || match.ai_analysis || '';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds(): { weekStart: string; weekEnd: string; weekLabel: string } {
  const now = new Date();
  // Next Monday
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const weekLabel = `${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return { weekStart: fmt(monday), weekEnd: fmt(sunday), weekLabel };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const bearerSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  const legacySecret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  const secret = bearerSecret || legacySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { weekStart, weekEnd, weekLabel } = getWeekBounds();
  const slug = `grandes-affiches-${weekStart}`;

  // Skip if already generated for this week
  const { data: existing } = await supabase
    .from('weekly_spotlights')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, message: 'Already generated', slug });
  }

  // Fetch predictions for the upcoming week
  const { data: predictions, error } = await supabase
    .from('match_predictions')
    .select(
      'slug, home_team, away_team, league, league_code, league_slug, country, match_date, match_time, prediction, prediction_type, probability, recommended_odds, value_edge, odds_home, odds_draw, odds_away, ai_analysis'
    )
    .gte('match_date', weekStart)
    .lte('match_date', weekEnd)
    .order('match_date', { ascending: true });

  if (error || !predictions || predictions.length === 0) {
    return NextResponse.json(
      { error: 'No predictions found for week', weekStart, weekEnd },
      { status: 404 }
    );
  }

  // Select key matches: priority leagues first, sorted by value_edge
  const scored = (predictions as PredictionRow[])
    .map((p) => ({
      ...p,
      priorityScore:
        (PRIORITY_LEAGUES.indexOf(p.league_code) !== -1
          ? PRIORITY_LEAGUES.length - PRIORITY_LEAGUES.indexOf(p.league_code)
          : 0) +
        (p.value_edge || 0) / 10,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const topMatches = scored.slice(0, MAX_KEY_MATCHES);

  // Generate deep analysis for each key match (sequential to respect rate limits)
  const keyMatches: KeyMatch[] = [];
  for (const match of topMatches) {
    const deepAnalysis = await generateDeepAnalysis(match);
    keyMatches.push({
      slug: match.slug,
      home_team: match.home_team,
      away_team: match.away_team,
      league: match.league,
      league_slug: match.league_slug,
      country: match.country,
      match_date: match.match_date,
      match_time: match.match_time,
      prediction: match.prediction,
      prediction_type: match.prediction_type,
      probability: match.probability,
      recommended_odds: match.recommended_odds,
      value_edge: match.value_edge,
      odds_home: match.odds_home,
      odds_draw: match.odds_draw,
      odds_away: match.odds_away,
      deep_analysis: deepAnalysis,
    });
  }

  // Generate editorial intro
  const summary = await generateWeeklyIntro(keyMatches, weekLabel);

  // Hero match = top key match
  const heroMatch = keyMatches[0]
    ? `${keyMatches[0].home_team} vs ${keyMatches[0].away_team}`
    : null;
  const featuredLeague = keyMatches[0]?.league || null;

  // Store in weekly_spotlights
  const { error: insertError } = await supabase.from('weekly_spotlights').insert({
    slug,
    week_start: weekStart,
    week_end: weekEnd,
    title: `Grandes Affiches — ${weekLabel}`,
    hero_match: heroMatch,
    featured_league: featuredLeague,
    summary,
    key_matches: keyMatches,
    all_match_slugs: predictions.map((p) => p.slug),
    published_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    slug,
    weekStart,
    weekEnd,
    keyMatchesCount: keyMatches.length,
    totalMatchesLinked: predictions.length,
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
