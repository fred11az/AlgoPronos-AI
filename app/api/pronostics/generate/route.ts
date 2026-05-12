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
import { createAdminClient, createClient, checkIsAdmin } from '@/lib/supabase/server';
import { matchService, type RealMatch } from '@/lib/services/match-service';
import { fetchMatchStats } from '@/lib/services/stats-service';
import { createMatchSlug, createLeagueSlug, createTeamSlug } from '@/lib/utils/slugify';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  sport: string;
  match_concept?: string; // e.g. "Ticket du Match"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function impliedPct(odds: number): number {
  return Math.round((1 / odds) * 100);
}

/** Map internal prediction_type → display type + value for ticket rendering */
function mapPickDisplay(predType: string): { type: string; value: string } {
  switch (predType) {
    case 'home':    return { type: '1X2',        value: '1' };
    case 'draw':    return { type: '1X2',        value: 'X' };
    case 'away':    return { type: '1X2',        value: '2' };
    case 'btts':    return { type: 'BTTS',       value: 'Oui' };
    case 'over25':  return { type: 'Over/Under', value: 'Over 2.5' };
    case 'under25': return { type: 'Over/Under', value: 'Under 2.5' };
    default:        return { type: '1X2',        value: '1' };
  }
}

/**
 * Picks the bet with the best value edge across all available markets.
 * Accepts optional stats (API-Football) to include BTTS and Over/Under candidates.
 */
function computeBestPick(
  oddsHome: number,
  oddsDraw: number,
  oddsAway: number,
  stats?: any,
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

  // Base model: slight home advantage + real API-Football probs when available
  const apiReal = stats?.dataSource === 'api-football';
  const modelHome = apiReal ? Math.max(Math.min(homePct + 4, 85), stats.homePct ?? 0) : Math.min(homePct + 4, 85);
  const modelDraw = apiReal ? Math.max(Math.max(drawPct - 2, 8),  stats.drawPct ?? 0) : Math.max(drawPct - 2, 8);
  const modelAway = apiReal ? Math.max(Math.max(awayPct - 2, 8),  stats.awayPct ?? 0) : Math.max(awayPct - 2, 8);

  const candidates: { label: string; type: string; odds: number; impliedP: number; modelP: number }[] = [
    { label: 'Victoire domicile',   type: 'home', odds: oddsHome, impliedP: impliedPct(oddsHome), modelP: modelHome },
    { label: 'Match nul',           type: 'draw', odds: oddsDraw, impliedP: impliedPct(oddsDraw), modelP: modelDraw },
    { label: 'Victoire extérieure', type: 'away', odds: oddsAway, impliedP: impliedPct(oddsAway), modelP: modelAway },
  ];

  // BTTS + Over/Under quand les stats API-Football sont disponibles
  if (stats) {
    if (stats.bttsOdds && stats.bttsProbability !== null) {
      candidates.push({ label: 'Les deux équipes marquent', type: 'btts',    odds: stats.bttsOdds,    impliedP: impliedPct(stats.bttsOdds),    modelP: stats.bttsProbability });
    }
    if (stats.over25Odds && stats.over25Probability !== null) {
      candidates.push({ label: 'Plus de 2.5 buts',          type: 'over25',  odds: stats.over25Odds,  impliedP: impliedPct(stats.over25Odds),  modelP: stats.over25Probability });
    }
    if (stats.under25Odds && stats.over25Probability !== null) {
      candidates.push({ label: 'Moins de 2.5 buts',         type: 'under25', odds: stats.under25Odds, impliedP: impliedPct(stats.under25Odds), modelP: 100 - stats.over25Probability });
    }
  }

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

/**
 * Calls the local OpenClaw AI gateway (OpenAI-compatible endpoint).
 * Falls back to Gemini Flash if OpenClaw is not reachable.
 */
async function callAIAnalysis(
  homeTeam: string,
  awayTeam: string,
  league: string,
  prediction: string,
  probability: number,
  homeForm: string,
  awayForm: string,
  sport: string = 'football'
): Promise<string> {
  const prompt = `Tu es un analyste ${sport} professionnel. Rédige une analyse SEO riche et unique (min 4 phrases) pour le match ${homeTeam} vs ${awayTeam} en ${league}.
Inclut des détails sur la forme : ${homeTeam} (${homeForm}) vs ${awayTeam} (${awayForm}).
Pronostic IA : ${prediction} (${probability}%).
Termine par un 'Ticket du Match' spécifique (ex: Score exact ou combiné buteur/résultat).
Rédige en français, ton expert, sans mentionner l'IA.`;

  // --- 1. Try OpenClaw (local AI engine) ---
  const openClawUrl = process.env.OPENCLAW_GATEWAY_URL;
  const openClawToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (openClawUrl && openClawToken) {
    try {
      const res = await fetch(openClawUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openClawToken}`,
        },
        body: JSON.stringify({
          model: 'openclaw',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch {
      // OpenClaw unavailable — fall through to Gemini
    }
  }

  // --- 2. Fallback: Groq ---
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return '';
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(20000),
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
  // Security: accept Vercel's injected Authorization: Bearer {CRON_SECRET}
  // or legacy x-cron-secret header or ?secret= query param
  const bearerSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  const legacySecret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  const secret = bearerSecret || legacySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    // Allow admin session as fallback (e.g. triggered from admin UI)
    const supabaseUser = await createClient();
    const { data: { session } } = await supabaseUser.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const supabase = await createAdminClient();
  const generated: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Compute date range: today → today+6 (7 days, 1 API call)
  const today = new Date();
  const fromStr = today.toISOString().split('T')[0];
  const toDate = new Date(today);
  toDate.setDate(today.getDate() + 6);
  const toStr = toDate.toISOString().split('T')[0];

  const sports = ['football', 'tennis', 'basketball', 'mma'];
  const results: any[] = [];

  for (const sport of sports) {
    console.log(`[Generate] Processing sport: ${sport}...`);
    let matchesByDate: Record<string, RealMatch[]>;
    try {
      const result = await matchService.getMatchesForRange(fromStr, toStr, sport);
      matchesByDate = result.byDate;
    } catch (err) {
      errors.push(`Error fetching ${sport}: ${err}`);
      continue;
    }

    const sportMatches: RealMatch[] = Object.values(matchesByDate).flat();
    if (sportMatches.length === 0) continue;

    // Process matches in batches to avoid timeouts/rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < sportMatches.length; i += BATCH_SIZE) {
      const batch = sportMatches.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (match) => {
        const dateStr = match.date;
        const slug = createMatchSlug(match.homeTeam, match.awayTeam, dateStr);

        // Check cache/existing
        const { data: existing } = await supabase
          .from('match_predictions')
          .select('id, expires_at')
          .eq('slug', slug)
          .single();

        if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
          skipped.push(slug);
          return;
        }

        if (!match.odds) {
          skipped.push(`${slug} (no odds)`);
          return;
        }

        // Fetch stats first — needed for BTTS/Over25 candidate selection
        const footballApiKey = sport === 'football' ? process.env.API_FOOTBALL_KEY : undefined;
        const stats = await fetchMatchStats(
          match.id,
          match.homeTeam,
          match.awayTeam,
          { home: match.odds.home, draw: match.odds.draw || 3.3, away: match.odds.away },
          footballApiKey
        );

        const homeForm = stats.homeForm?.form ?? 'N/A';
        const awayForm = stats.awayForm?.form ?? 'N/A';

        // computeBestPick uses stats to include BTTS/Over25 markets when available
        const finalPred = computeBestPick(match.odds.home, match.odds.draw || 3.3, match.odds.away, stats);

        const aiAnalysis = await callAIAnalysis(
          match.homeTeam,
          match.awayTeam,
          match.league,
          finalPred.prediction,
          finalPred.probability,
          homeForm,
          awayForm,
          sport
        );

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
          odds_home: match.odds.home,
          odds_draw: match.odds.draw || null,
          odds_away: match.odds.away,
          prediction: finalPred.prediction,
          prediction_type: finalPred.predictionType,
          probability: finalPred.probability,
          implied_probability: finalPred.impliedPct,
          value_edge: finalPred.valueEdge,
          recommended_odds: finalPred.recommendedOdds,
          ai_analysis: aiAnalysis || null,
          home_form: homeForm,
          away_form: awayForm,
          expires_at: matchDateTime.toISOString(),
          sport: sport,
        };

        const { error } = await supabase.from('match_predictions').upsert(row, { onConflict: 'slug' });
        if (error) errors.push(`${slug}: ${error.message}`);
        else generated.push(slug);
      }));
    }
  }

  // ── Advanced Betting Strategies: Montante & Optimus ─────────────────────────
  if (generated.length > 0) {
    await generateSpecialTickets(supabase, fromStr);
  }

  // ── Auto-indexing: ping Google + IndexNow after generating new pages ─────
  if (generated.length > 0) {
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://algopronos.com';
    const newUrls = generated.map((s) => `${BASE_URL}/pronostic/${s}`);

    // 1. Ping Google sitemap (tells Googlebot the sitemap has been updated)
    try {
      await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`,
        { method: 'GET', signal: AbortSignal.timeout(5000) },
      );
    } catch {
      // Non-blocking — ignore network errors
    }

    // 2. IndexNow — instant indexing for Bing/Yandex/others
    //    Requires: /public/indexnow-key.txt containing INDEXNOW_KEY value
    if (process.env.INDEXNOW_KEY) {
      try {
        await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: new URL(BASE_URL).hostname,
            key: process.env.INDEXNOW_KEY,
            keyLocation: `${BASE_URL}/${process.env.INDEXNOW_KEY}.txt`,
            urlList: newUrls,
          }),
          signal: AbortSignal.timeout(8000),
        });
      } catch {
        // Non-blocking
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

// GET handler for Vercel cron (crons send Authorization: Bearer {CRON_SECRET})
// and for browser testing with ?secret= query param
export async function GET(req: NextRequest) {
  const bearerSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  const querySecret = new URL(req.url).searchParams.get('secret');
  const secret = bearerSecret || querySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized — use Authorization: Bearer header or ?secret=YOUR_CRON_SECRET' }, { status: 401 });
  }
  return POST(req);
}

/**
 * Selects an Optimus combo from a prediction pool.
 * 1. Filters for value bets (value_edge > 0)
 * 2. Diversifies by league_code (max 1 pick per league)
 * 3. Finds combo of 2–4 picks with combined odds in [5.0, 8.0]
 *    → maximises avg value_edge, prefers 3 picks over 2 or 4
 *    → falls back to closest-to-5.0 if no combo lands in the range
 */
function buildOptimusCombo(pool: any[]): any[] {
  const TARGET_MIN = 5.0;
  const TARGET_MAX = 8.0;

  // 1. Value filter — prefer edge > 3, relax to > 0 if not enough candidates
  let valued = pool.filter((m: any) => (m.value_edge ?? 0) > 3);
  if (valued.length < 4) valued = pool.filter((m: any) => (m.value_edge ?? 0) > 0);
  if (valued.length < 2) valued = pool;

  // 2. League diversification — best (highest value_edge) per league_code
  const byLeague = new Map<string, any>();
  for (const m of valued) {
    const code = m.league_code || 'TOP';
    if (!byLeague.has(code) || (m.value_edge ?? 0) > (byLeague.get(code).value_edge ?? 0)) {
      byLeague.set(code, m);
    }
  }
  const diversified = Array.from(byLeague.values())
    .sort((a: any, b: any) => (b.value_edge ?? 0) - (a.value_edge ?? 0))
    .slice(0, 10);

  // 3. Brute-force combos 2–4, keep those within [TARGET_MIN, TARGET_MAX]
  let best: any[] = [];
  let bestScore = -Infinity;

  const tryCombo = (combo: any[]) => {
    const totalOdds = combo.reduce((acc: number, m: any) => acc * (m.recommended_odds || 1), 1);
    if (totalOdds < TARGET_MIN || totalOdds > TARGET_MAX) return;
    const avgEdge = combo.reduce((acc: number, m: any) => acc + (m.value_edge ?? 0), 0) / combo.length;
    const sizeBonus = combo.length === 3 ? 1.0 : combo.length === 2 ? 0.3 : 0;
    if (avgEdge + sizeBonus > bestScore) { bestScore = avgEdge + sizeBonus; best = combo; }
  };

  const c = diversified;
  for (let i = 0; i < c.length; i++)
    for (let j = i + 1; j < c.length; j++) {
      tryCombo([c[i], c[j]]);
      for (let k = j + 1; k < c.length; k++) {
        tryCombo([c[i], c[j], c[k]]);
        for (let l = k + 1; l < c.length; l++)
          tryCombo([c[i], c[j], c[k], c[l]]);
      }
    }

  // Fallback: no combo in [5, 8] → pick 3 closest to 5.0 from diversified pool
  if (best.length === 0) {
    let bestDiff = Infinity;
    for (let i = 0; i < c.length; i++)
      for (let j = i + 1; j < c.length; j++)
        for (let k = j + 1; k < c.length; k++) {
          const o = (c[i].recommended_odds||1) * (c[j].recommended_odds||1) * (c[k].recommended_odds||1);
          const d = Math.abs(o - 5.0);
          if (d < bestDiff) { bestDiff = d; best = [c[i], c[j], c[k]]; }
        }
  }

  return best;
}

/**
 * Strategy Generator: Montante & Optimus
 */
async function generateSpecialTickets(supabase: any, date: string) {
  const { data: pool } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('match_date', date)
    .order('value_edge', { ascending: false });

  if (!pool || pool.length < 2) return;

  // 1. MONTANTE — pick le Double Chance le plus sûr (impliedPct le plus élevé)
  const montandeCandidate = pool.reduce((best: any, m: any) => {
    const implied = m.implied_probability ?? Math.round((1 / (m.recommended_odds || 2)) * 100);
    const bestImplied = best ? (best.implied_probability ?? Math.round((1 / (best.recommended_odds || 2)) * 100)) : 0;
    return implied > bestImplied ? m : best;
  }, null);

  if (montandeCandidate) {
    const { type, value } = mapPickDisplay(montandeCandidate.prediction_type);
    await supabase.from('daily_ticket').upsert({
      date,
      type: 'montante',
      matches: [{
        matchId: montandeCandidate.slug,
        homeTeam: montandeCandidate.home_team,
        awayTeam: montandeCandidate.away_team,
        league: montandeCandidate.league,
        selection: { type, value, odds: montandeCandidate.recommended_odds },
      }],
      total_odds: montandeCandidate.recommended_odds,
      confidence_pct: montandeCandidate.implied_probability ?? 90,
      status: 'pending',
    }, { onConflict: 'date,type' });
  }

  // 2. OPTIMUS — value bets diversifiés, cote combinée 5–8
  const optimusMatches = buildOptimusCombo(pool);
  if (optimusMatches.length < 2) return;

  const totalOdds = Math.round(optimusMatches.reduce((acc: number, m: any) => acc * (m.recommended_odds || 1), 1) * 100) / 100;
  const confidencePct = Math.round(optimusMatches.reduce((acc: number, m: any) => acc + (m.probability || 60), 0) / optimusMatches.length);

  await supabase.from('daily_ticket').upsert({
    date,
    type: 'optimus',
    access_tier: 'optimised_only',
    matches: optimusMatches.map((m: any) => {
      const { type, value } = mapPickDisplay(m.prediction_type);
      return {
        matchId: m.slug,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        league: m.league,
        selection: { type, value, odds: m.recommended_odds },
      };
    }),
    total_odds: totalOdds,
    confidence_pct: confidencePct,
    status: 'pending',
  }, { onConflict: 'date,type' });
}
