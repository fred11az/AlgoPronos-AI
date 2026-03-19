/**
 * Standalone daily pronostics generator — runs via GitHub Actions (no Vercel timeout).
 *
 * Reads from matches_cache in Supabase, generates predictions, upserts into match_predictions.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GROQ_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Slug helpers (mirrors lib/utils/slugify.ts) ─────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}

function createMatchSlug(home, away, date) {
  return `${slugify(home)}-vs-${slugify(away)}-${date}`;
}

// ─── Prediction logic (mirrors route.ts) ─────────────────────────────────────

function impliedPct(odds) {
  return Math.round((1 / odds) * 100);
}

function generateForm() {
  const outcomes = ['W', 'D', 'L'];
  return Array.from({ length: 5 }, () => outcomes[Math.floor(Math.random() * outcomes.length)]).join('');
}

function computePrediction(homeOdds, drawOdds, awayOdds) {
  const homePct = impliedPct(homeOdds);
  const drawPct = drawOdds > 0 ? impliedPct(drawOdds) : 0;
  const awayPct = impliedPct(awayOdds);
  const total = homePct + drawPct + awayPct;

  const homeProb = Math.round((homePct / total) * 100);
  const drawProb = Math.round((drawPct / total) * 100);
  const awayProb = Math.round((awayPct / total) * 100);

  const options = [
    { label: '1', prediction: 'Victoire domicile', prob: homeProb, odds: homeOdds, implied: homePct },
    { label: 'X', prediction: 'Match nul', prob: drawProb, odds: drawOdds, implied: drawPct },
    { label: '2', prediction: 'Victoire extérieur', prob: awayProb, odds: awayOdds, implied: awayPct },
  ].filter((o) => o.odds > 0);

  const best = options.reduce((a, b) => (a.prob - a.implied > b.prob - b.implied ? a : b));

  return {
    prediction: best.label,
    predictionType: best.prediction,
    probability: best.prob,
    impliedPct: best.implied,
    valueEdge: best.prob - best.implied,
    recommendedOdds: best.odds,
  };
}

// ─── AI Analysis (Groq only) ──────────────────────────────────────────────────

async function callAIAnalysis(homeTeam, awayTeam, league, prediction, probability, homeForm, awayForm, sport) {
  if (!GROQ_API_KEY) return '';
  try {
    const prompt = `Tu es un analyste ${sport} professionnel. Rédige une analyse SEO riche et unique (min 4 phrases) pour le match ${homeTeam} vs ${awayTeam} en ${league}.
Inclut des détails sur la forme : ${homeTeam} (${homeForm}) vs ${awayTeam} (${awayForm}).
Pronostic IA : ${prediction} (${probability}%).
Termine par un 'Ticket du Match' spécifique (ex: Score exact ou combiné buteur/résultat).
Rédige en français, ton expert, sans mentionner l'IA.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
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

// ─── Date range helper ────────────────────────────────────────────────────────

function getDateRange(days = 7) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dates = getDateRange(7);
  console.log(`[Generate] Date range: ${dates[0]} → ${dates[dates.length - 1]}`);

  // Fetch all cache entries for the date range
  const { data: cacheRows, error: cacheError } = await supabase
    .from('matches_cache')
    .select('date, matches')
    .in('date', dates);

  if (cacheError) {
    console.error('[Generate] Failed to read matches_cache:', cacheError.message);
    process.exit(1);
  }

  if (!cacheRows || cacheRows.length === 0) {
    console.warn('[Generate] No cached matches found for date range.');
    process.exit(0);
  }

  // Flatten all matches
  const allMatches = cacheRows.flatMap((row) =>
    (row.matches || []).map((m) => ({ ...m, _cacheDate: row.date }))
  );

  console.log(`[Generate] ${allMatches.length} matches to process...`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  // Process one at a time to avoid rate limits (GH Actions has no timeout)
  for (const match of allMatches) {
    const dateStr = match.date || match._cacheDate;
    const slug = createMatchSlug(match.homeTeam, match.awayTeam, dateStr);
    const sport = match.sport || 'football';

    // Skip if already exists and not expired
    const { data: existing } = await supabase
      .from('match_predictions')
      .select('id, expires_at')
      .eq('slug', slug)
      .single();

    if (existing?.expires_at && new Date(existing.expires_at) > new Date()) {
      skipped++;
      continue;
    }

    if (!match.odds) {
      skipped++;
      continue;
    }

    const pred = computePrediction(match.odds.home, match.odds.draw || 0, match.odds.away);
    const homeForm = generateForm();
    const awayForm = generateForm();

    const aiAnalysis = await callAIAnalysis(
      match.homeTeam,
      match.awayTeam,
      match.league,
      pred.prediction,
      pred.probability,
      homeForm,
      awayForm,
      sport
    );

    const matchDateTime = new Date(`${dateStr}T${match.time || '15:00'}:00Z`);
    matchDateTime.setHours(matchDateTime.getHours() + 3);

    const row = {
      slug,
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      home_team_slug: slugify(match.homeTeam),
      away_team_slug: slugify(match.awayTeam),
      league: match.league,
      league_code: match.leagueCode || '',
      league_slug: slugify(match.league),
      country: match.country || '',
      match_date: dateStr,
      match_time: match.time || '15:00',
      odds_home: match.odds.home,
      odds_draw: match.odds.draw || null,
      odds_away: match.odds.away,
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
      sport,
    };

    const { error } = await supabase.from('match_predictions').upsert(row, { onConflict: 'slug' });
    if (error) {
      console.error(`  [ERROR] ${slug}: ${error.message}`);
      errors++;
    } else {
      console.log(`  [OK] ${slug}`);
      generated++;
    }
  }

  console.log(`\n[Generate] Done — ${generated} generated, ${skipped} skipped, ${errors} errors.`);
}

main().catch((err) => {
  console.error('[Generate] Fatal error:', err);
  process.exit(1);
});
