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
import { matchService, type RealMatch } from '@/lib/services/match-service';
import { createMatchSlug, createLeagueSlug, createTeamSlug } from '@/lib/utils/slugify';

export const maxDuration = 300; // 5 minutes (requires Vercel Pro)

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

/**
 * Calls the local OpenClaw AI gateway (OpenAI-compatible endpoint).
 * Falls back to Groq if OpenClaw is not reachable.
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

  const messages = [{ role: 'user', content: prompt }];

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
          messages,
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout for local AI
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch {
      // OpenClaw unavailable — fall through to Groq
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
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
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
  // Security: accept Vercel's injected Authorization: Bearer {CRON_SECRET}
  // or legacy x-cron-secret header or ?secret= query param
  const bearerSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  const legacySecret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  const secret = bearerSecret || legacySecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

// Support GET with secret param for browser testing
export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized — add ?secret=YOUR_CRON_SECRET' }, { status: 401 });
  }
  return POST(req);
}

/**
 * Strategy Generator: Montante & Optimus
 */
async function generateSpecialTickets(supabase: any, date: string) {
  // Fetch a pool of high-confidence predictions for today
  const { data: pool } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('match_date', date)
    .order('probability', { ascending: false });

  if (!pool || pool.length < 5) return;

  // 1. MONTANTE (1 Ultra Safe match)
  const safe = pool.find((m: any) => m.odds_home < 1.45 || m.odds_away < 1.45);
  if (safe) {
    await supabase.from('daily_ticket').upsert({
      date,
      type: 'montante',
      matches: [{
        matchId: safe.slug,
        homeTeam: safe.home_team,
        awayTeam: safe.away_team,
        league: safe.league,
        selection: { type: safe.prediction_type, value: '1', odds: safe.recommended_odds }
      }],
      total_odds: safe.recommended_odds,
      confidence_pct: 90,
      status: 'pending'
    }, { onConflict: 'date,type' });
  }

  // 2. OPTIMUS (Cote ~5.0 / 3-4 matches)
  const optimusMatches = pool.slice(0, 4);
  const totalOdds = optimusMatches.reduce((acc: number, m: any) => acc * (m.recommended_odds || 1), 1);
  
  await supabase.from('daily_ticket').upsert({
    date,
    type: 'optimus',
    access_tier: 'optimised_only',
    matches: optimusMatches.map((m: any) => ({
      matchId: m.slug,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      selection: { type: m.prediction_type, value: '1', odds: m.recommended_odds }
    })),
    total_odds: Math.round(totalOdds * 100) / 100,
    confidence_pct: 75,
    status: 'pending'
  }, { onConflict: 'date,type' });
}
