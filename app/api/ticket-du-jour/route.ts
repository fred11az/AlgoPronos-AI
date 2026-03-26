import { NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { matchService } from '@/lib/services/match-service';
import { fetchStatsForMatches, type MatchStats } from '@/lib/services/stats-service';

export const dynamic = 'force-dynamic';

// ─── Config ───────────────────────────────────────────────────────────────────

// Ligues prioritaires pour le Ticket du Jour (top européennes + Africa)
const DAILY_TICKET_LEAGUES = ['PL', 'LA', 'SA', 'BL', 'FL', 'CL', 'PT1', 'NL1'];
const FALLBACK_LEAGUES = ['TR1', 'BE1', 'SC1', 'BR1', 'AR1', 'MX1', 'US1'];
const DAILY_MATCH_COUNT = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PickCandidate {
  type: string;
  value: string;
  odds: number;
  impliedPct: number;
  modelPct: number | null;
  valueEdge: number | null;
}

interface MatchInput {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  odds: { home: number; draw: number; away: number };
}

// ─── Algorithm (same as generate/route.ts) ───────────────────────────────────

function computeDCOdds(o1: number, o2: number): number {
  return Math.round((o1 * o2 / (o1 + o2)) * 100) / 100;
}

// Seuil minimal de probabilité implicite par pick (pour garantir confiance globale ≥ 55%)
const MIN_PICK_IMPLIED_PCT = 62;

function pickForMatch(
  match: MatchInput,
  stats: MatchStats | undefined,
): { type: string; value: string; odds: number; impliedPct: number; modelPct: number | null; valueEdge: number | null; reasoning: string | null } {
  const { home: ho, draw: dr, away: aw } = stats?.realOdds ?? match.odds;
  const dc1X = computeDCOdds(ho, dr);
  const dcX2 = computeDCOdds(dr, aw);

  const candidates: PickCandidate[] = [];

  const addCandidate = (type: string, value: string, odds: number, modelPct: number | null) => {
    if (odds < 1.01 || odds > 15) return;
    const impliedPct = Math.round((1 / odds) * 100);
    const valueEdge = modelPct !== null ? Math.round((modelPct - impliedPct) * 10) / 10 : null;
    candidates.push({ type, value, odds, impliedPct, modelPct, valueEdge });
  };

  // ── 1X2 & Double Chance ─────────────────────────────────────────────────────
  addCandidate('1X2', '1', ho, stats?.homePct ?? null);
  addCandidate('1X2', 'X', dr, stats?.drawPct ?? null);
  addCandidate('1X2', '2', aw, stats?.awayPct ?? null);
  addCandidate('Double Chance', '1X', dc1X, stats ? stats.homePct + stats.drawPct : null);
  addCandidate('Double Chance', 'X2', dcX2, stats ? stats.drawPct + stats.awayPct : null);

  // ── BTTS (Les deux équipes marquent) ────────────────────────────────────────
  // Utilise les cotes bookmaker + probabilité Poisson calculée depuis xG
  if (stats?.bttsOdds && stats.bttsProbability !== null) {
    addCandidate('BTTS', 'Oui', stats.bttsOdds, stats.bttsProbability);
  }
  if (stats?.bttsNoOdds && stats.bttsProbability !== null) {
    addCandidate('BTTS', 'Non', stats.bttsNoOdds, 100 - stats.bttsProbability);
  }

  // ── Over / Under 2.5 ────────────────────────────────────────────────────────
  if (stats?.over25Odds && stats.over25Probability !== null) {
    addCandidate('Over/Under', 'Over 2.5', stats.over25Odds, stats.over25Probability);
  }
  if (stats?.under25Odds && stats.over25Probability !== null) {
    addCandidate('Over/Under', 'Under 2.5', stats.under25Odds, 100 - stats.over25Probability);
  }

  // ── Sélection du meilleur pick ───────────────────────────────────────────────
  // Priorité aux picks sûrs (impliedPct ≥ MIN_PICK_IMPLIED_PCT)
  const safePool = candidates.filter(c => c.impliedPct >= MIN_PICK_IMPLIED_PCT);
  const pool = safePool.length >= 1 ? safePool : candidates;

  if (!pool || pool.length === 0) {
    return {
      type: '1X2',
      value: '1',
      odds: ho || 1.85,
      impliedPct: ho ? Math.round((1/ho)*100) : 54,
      modelPct: stats?.homePct ?? null,
      valueEdge: null,
      reasoning: 'Fallback selection due to empty analysis pool',
    };
  }

  // Score: favorise probabilité implicite élevée + edge positif + cotes raisonnables (1.40–2.10)
  // La cible est 1.75 (centre entre sécurité et rendement) pour accepter Over/BTTS
  const best = pool.reduce((a, b) => {
    const score = (c: PickCandidate) =>
      c.impliedPct * 2
      + (c.valueEdge ?? 0) * 1.5
      - Math.abs(c.odds - 1.75) * 0.4;
    return score(b) > score(a) ? b : a;
  }, pool[0]);

  // Build reasoning string with all available context
  const reasoningParts: string[] = [];
  if (stats?.advice) reasoningParts.push(`Conseil IA: "${stats.advice}"`);
  if (stats?.h2h && stats.h2h.totalMatches > 0) {
    const h = stats.h2h;
    reasoningParts.push(`H2H: ${h.homeWins}V-${h.draws}N-${h.awayWins}V`);
  }
  if (stats?.underOverAdvice) reasoningParts.push(`Over/Under: ${stats.underOverAdvice}`);

  return {
    type: best.type,
    value: best.value,
    odds: best.odds || 1.85,
    impliedPct: best.impliedPct || 54,
    modelPct: best.modelPct ?? null,
    valueEdge: best.valueEdge ?? null,
    reasoning: reasoningParts.length > 0 ? reasoningParts.join(' | ') : null,
  };
}

// ─── Market type mapping ──────────────────────────────────────────────────────

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

// ─── Optimus combo builder ────────────────────────────────────────────────────
// 1. Value bets uniquement (value_edge > 0, préférence > 3)
// 2. Max 1 pick par league_code (diversification)
// 3. Cote combinée dans [5.0, 8.0], maximise avg value_edge, préfère 3 picks

interface OptimusCandidate {
  league_code: string;
  value_edge: number | null;
  recommended_odds: number;
  prediction_type: string;
  [key: string]: any;
}

function buildOptimusCombo<T extends OptimusCandidate>(pool: T[]): T[] {
  const TARGET_MIN = 5.0;
  const TARGET_MAX = 8.0;

  let valued = pool.filter(m => (m.value_edge ?? 0) > 3);
  if (valued.length < 4) valued = pool.filter(m => (m.value_edge ?? 0) > 0);
  if (valued.length < 2) valued = pool;

  const byLeague = new Map<string, T>();
  for (const m of valued) {
    const code = m.league_code || 'TOP';
    if (!byLeague.has(code) || (m.value_edge ?? 0) > (byLeague.get(code)!.value_edge ?? 0)) {
      byLeague.set(code, m);
    }
  }
  const c = Array.from(byLeague.values())
    .sort((a, b) => (b.value_edge ?? 0) - (a.value_edge ?? 0))
    .slice(0, 10);

  let best: T[] = [];
  let bestScore = -Infinity;

  const tryCombo = (combo: T[]) => {
    const totalOdds = combo.reduce((acc, m) => acc * (m.recommended_odds || 1), 1);
    if (totalOdds < TARGET_MIN || totalOdds > TARGET_MAX) return;
    const avgEdge = combo.reduce((acc, m) => acc + (m.value_edge ?? 0), 0) / combo.length;
    const sizeBonus = combo.length === 3 ? 1.0 : combo.length === 2 ? 0.3 : 0;
    if (avgEdge + sizeBonus > bestScore) { bestScore = avgEdge + sizeBonus; best = combo; }
  };

  for (let i = 0; i < c.length; i++)
    for (let j = i + 1; j < c.length; j++) {
      tryCombo([c[i], c[j]]);
      for (let k = j + 1; k < c.length; k++) {
        tryCombo([c[i], c[j], c[k]]);
        for (let l = k + 1; l < c.length; l++)
          tryCombo([c[i], c[j], c[k], c[l]]);
      }
    }

  // Fallback: aucun combo dans [5, 8] → le plus proche de 5.0
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

// ─── Groq analysis ────────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Tu es AlgoPronos AI, analyste sportif expert. Génère une analyse courte et percutante pour le Ticket IA du Jour. Réponds UNIQUEMENT en JSON valide.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return '';
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const data = JSON.parse(text);
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ─── Main: GET ────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'classic';
    const forceRequested = searchParams.get('force') === 'true';

    // force=true bypasses cache and re-consumes API quota — admin only
    let force = false;
    if (forceRequested) {
      const user = await getCurrentUser();
      const isAdmin = user ? await checkIsAdmin(user.id) : false;
      if (!isAdmin) {
        return NextResponse.json({ error: 'Accès refusé — force réservé à l\'admin' }, { status: 403 });
      }
      force = true;
    }
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // ── 1. Return cached daily ticket if exists ──────────────────────────────
    if (!force) {
      // Try with type filter first; if column doesn't exist, fall back to date-only
      let existingQuery = adminSupabase
        .from('daily_ticket')
        .select('*')
        .eq('date', today)
        .eq('type', type)
        .single();
      const { data: existing, error: existErr } = await existingQuery;

      if (existing) {
        return NextResponse.json({ ticket: existing, fromCache: true });
      }

      // If type column doesn't exist, try without it (date-only lookup)
      if (existErr && (existErr.code === 'PGRST204' || existErr.message?.includes('type'))) {
        const { data: existingNoType } = await adminSupabase
          .from('daily_ticket')
          .select('*')
          .eq('date', today)
          .single();
        if (existingNoType) {
          return NextResponse.json({ ticket: existingNoType, fromCache: true });
        }
      }
    } else {
      // Delete existing ticket to allow regeneration
      // Ignore errors (column might not exist)
      await adminSupabase
        .from('daily_ticket')
        .delete()
        .eq('date', today)
        .eq('type', type)
        .then(() => {}, () => {});
    }

    // ── 2b. OPTIMUS: logique dédiée — combo 2-4 matchs ciblant cote ~5.00 ───
    if (type === 'optimus') {
      const { data: pool } = await adminSupabase
        .from('match_predictions')
        .select('*')
        .eq('match_date', today)
        .eq('sport', 'football')
        .gte('probability', 55)
        .order('probability', { ascending: false })
        .limit(20);

      // If no pre-generated predictions exist, fall back to live matches + quick prediction
      if (!pool || pool.length < 2) {
        console.warn('[ticket-du-jour] No match_predictions found for Optimus — falling back to live matches');
        let liveMatches = await matchService.getMatchesForDate(today, 'football', DAILY_TICKET_LEAGUES);
        if (liveMatches.length < 2) {
          const extra = await matchService.getMatchesForDate(today, 'football', FALLBACK_LEAGUES);
          liveMatches = [...liveMatches, ...extra];
        }
        if (liveMatches.length < 2) {
          const all = await matchService.getMatchesForDate(today, 'football');
          liveMatches = [...liveMatches, ...all];
        }
        const seen = new Set<string>();
        const avail = liveMatches.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return m.status === 'scheduled' && m.odds;
        }).slice(0, 10);

        if (avail.length >= 2) {
          // Build synthetic pool using real pickForMatch() + stats (no random picks)
          const fallbackStatsMap = await fetchStatsForMatches(
            avail.map(m => ({ ...m, odds: { home: m.odds!.home, draw: m.odds!.draw || 3.3, away: m.odds!.away }, country: m.country })),
            process.env.API_FOOTBALL_KEY
          ).catch(() => new Map<string, MatchStats>());

          // Convertit le pick interne (type '1X2'/'BTTS'/etc.) → prediction_type court ('home'/'btts'/etc.)
          const toPredType = (pickType: string, pickValue: string): string => {
            if (pickType === 'BTTS') return pickValue === 'Oui' ? 'btts' : 'btts_no';
            if (pickType === 'Over/Under') return pickValue === 'Over 2.5' ? 'over25' : 'under25';
            if (pickType === 'Double Chance') return pickValue === '1X' ? 'home' : 'away'; // approximation
            return pickValue === '1' ? 'home' : pickValue === '2' ? 'away' : 'draw';
          };

          const syntheticPool: OptimusCandidate[] = avail.map(m => {
            const pick = pickForMatch(
              { ...m, odds: { home: m.odds!.home, draw: m.odds!.draw || 3.3, away: m.odds!.away } },
              fallbackStatsMap.get(m.id)
            );
            return {
              slug: m.id,
              home_team: m.homeTeam,
              away_team: m.awayTeam,
              // Filtre les ligues inconnues : utilise leagueCode comme fallback
              league: m.league.includes('Unknown') ? (m.leagueCode || m.league) : m.league,
              league_code: m.leagueCode || 'TOP',
              match_date: m.date,
              match_time: m.time,
              recommended_odds: pick.odds,
              prediction_type: toPredType(pick.type, pick.value),
              probability: pick.modelPct ?? pick.impliedPct,
              value_edge: pick.valueEdge ?? 0,
            };
          });

          const optimusSelected = buildOptimusCombo(syntheticPool);
          const totalOdds = Math.round(optimusSelected.reduce((acc, m) => acc * (m.recommended_odds || 1), 1) * 100) / 100;
          const confidencePct = Math.round(optimusSelected.reduce((acc, m) => acc + (m.probability || 60), 0) / optimusSelected.length);
          const optimusPicks = optimusSelected.map(m => {
            const { type, value } = mapPickDisplay(m.prediction_type);
            return {
              matchId: m.slug, homeTeam: m.home_team, awayTeam: m.away_team,
              league: m.league, kickoffTime: `${m.match_date} ${m.match_time || ''}`.trim(),
              selection: { type, value, odds: m.recommended_odds, impliedPct: Math.round((1 / (m.recommended_odds || 2)) * 100) },
            };
          });
          const optimusTicket = { date: today, type: 'optimus', matches: optimusPicks, total_odds: totalOdds, confidence_pct: confidencePct, risk_level: 'balanced', analysis: {}, status: 'pending' };
          let { data: savedOptimusF, error: optimusErrorF } = await adminSupabase.from('daily_ticket').upsert(optimusTicket, { onConflict: 'date,type' }).select().single();
          if (optimusErrorF && (optimusErrorF.code === 'PGRST204' || optimusErrorF.message?.includes('type'))) {
            const { type: _t, ...noType } = optimusTicket;
            const fb = await adminSupabase.from('daily_ticket').insert(noType).select().single();
            savedOptimusF = fb.data; optimusErrorF = fb.error;
          }
          return NextResponse.json({ ticket: optimusErrorF ? { ...optimusTicket, id: 'temp', created_at: new Date().toISOString() } : savedOptimusF, fromCache: false });
        }

        return NextResponse.json(
          { error: 'Pas assez de matchs disponibles pour générer le ticket Optimus aujourd\'hui.' },
          { status: 503 }
        );
      }

      const optimusSelected = buildOptimusCombo((pool ?? []).map(m => ({
        ...m,
        league_code: m.league_code || 'TOP',
        value_edge: m.value_edge ?? 0,
        recommended_odds: m.recommended_odds || 1.5,
        prediction_type: m.prediction_type || 'home',
      })));

      const totalOdds = Math.round(optimusSelected.reduce((acc, m) => acc * (m.recommended_odds || 1), 1) * 100) / 100;
      const confidencePct = Math.round(optimusSelected.reduce((acc, m) => acc + (m.probability || 60), 0) / optimusSelected.length);

      const optimusPicks = optimusSelected.map(m => {
        const { type, value } = mapPickDisplay(m.prediction_type);
        return {
          matchId: m.slug,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          kickoffTime: `${m.match_date} ${m.match_time || ''}`.trim(),
          selection: { type, value, odds: m.recommended_odds, impliedPct: Math.round((1 / (m.recommended_odds || 2)) * 100) },
        };
      });

      const optimusTicket = {
        date: today,
        type: 'optimus',
        matches: optimusPicks,
        total_odds: totalOdds,
        confidence_pct: confidencePct,
        risk_level: 'balanced',
        analysis: {},
        status: 'pending',
      };

      let { data: savedOptimus, error: optimusError } = await adminSupabase
        .from('daily_ticket')
        .upsert(optimusTicket, { onConflict: 'date,type' })
        .select()
        .single();

      // Fallback: if `type` column or unique constraint doesn't exist, try plain insert
      if (optimusError && (optimusError.code === 'PGRST204' || optimusError.message?.includes('type'))) {
        console.warn('[ticket-du-jour] Optimus: type column not found, trying insert without it');
        const { type: _t, ...optimusNoType } = optimusTicket;
        const fallback = await adminSupabase.from('daily_ticket').insert(optimusNoType).select().single();
        savedOptimus  = fallback.data;
        optimusError  = fallback.error;
      }

      if (optimusError) {
        console.error('[ticket-du-jour] Optimus DB error:', optimusError);
      }

      return NextResponse.json({
        ticket: optimusError ? { ...optimusTicket, id: 'temp', created_at: new Date().toISOString() } : savedOptimus,
        fromCache: false,
      });
    }

    // ── 2b. MONTANTE: single ultra-safe Double Chance pick ───────────────────
    if (type === 'montante') {
      let montMatches = await matchService.getMatchesForDate(today, 'football', DAILY_TICKET_LEAGUES);
      if (montMatches.length < 1) {
        const extra = await matchService.getMatchesForDate(today, 'football', FALLBACK_LEAGUES);
        montMatches = [...montMatches, ...extra];
      }
      const montAvail = montMatches
        .filter(m => m.status === 'scheduled' && m.odds)
        .slice(0, 10);

      if (montAvail.length < 1) {
        return NextResponse.json({ error: 'Pas de matchs disponibles pour la Montante aujourd\'hui.' }, { status: 503 });
      }

      const montStatsMap = await fetchStatsForMatches(
        montAvail.map(m => ({ ...m, odds: { home: m.odds!.home, draw: m.odds!.draw || 3.3, away: m.odds!.away }, country: m.country })),
        process.env.API_FOOTBALL_KEY
      ).catch(() => new Map<string, MatchStats>());

      // Find the safest Double Chance pick across all available matches
      let safestMatch = montAvail[0];
      let safestPick = pickForMatch(
        { ...montAvail[0], odds: { home: montAvail[0].odds!.home, draw: montAvail[0].odds!.draw || 3.3, away: montAvail[0].odds!.away } },
        montStatsMap.get(montAvail[0].id)
      );

      for (const m of montAvail.slice(1)) {
        const stats = montStatsMap.get(m.id);
        const ho = m.odds!.home, dr = m.odds!.draw || 3.3, aw = m.odds!.away;
        // For montante, always compute the best Double Chance pick (1X or X2)
        const dc1X = computeDCOdds(ho, dr);
        const dcX2 = computeDCOdds(dr, aw);
        // Pick the safer DC (higher implied probability = lower odds)
        const dcOdds = dc1X <= dcX2 ? dc1X : dcX2;
        const dcValue = dc1X <= dcX2 ? '1X' : 'X2';
        const dcImplied = Math.round((1 / dcOdds) * 100);
        const dcModelPct = stats
          ? (dcValue === '1X' ? stats.homePct + stats.drawPct : stats.drawPct + stats.awayPct)
          : null;

        if (dcImplied > safestPick.impliedPct) {
          safestMatch = m;
          safestPick = { type: 'Double Chance', value: dcValue, odds: dcOdds, impliedPct: dcImplied, modelPct: dcModelPct, valueEdge: null, reasoning: null };
        }
      }

      const montTicket = {
        date: today,
        type: 'montante',
        matches: [{
          matchId: safestMatch.id,
          homeTeam: safestMatch.homeTeam,
          awayTeam: safestMatch.awayTeam,
          league: safestMatch.league,
          kickoffTime: `${safestMatch.date} ${safestMatch.time}`.trim(),
          selection: safestPick,
        }],
        total_odds: safestPick.odds,
        confidence_pct: safestPick.modelPct ?? safestPick.impliedPct,
        risk_level: 'low',
        analysis: {},
        status: 'pending',
      };

      let { data: savedMont, error: montError } = await adminSupabase
        .from('daily_ticket').upsert(montTicket, { onConflict: 'date,type' }).select().single();
      if (montError && (montError.code === 'PGRST204' || montError.message?.includes('type'))) {
        const { type: _t, ...noType } = montTicket;
        const fb = await adminSupabase.from('daily_ticket').insert(noType).select().single();
        savedMont = fb.data; montError = fb.error;
      }

      return NextResponse.json({
        ticket: montError ? { ...montTicket, id: 'temp', created_at: new Date().toISOString() } : savedMont,
        fromCache: false,
      });
    }

    // ── 2. Fetch today's matches ─────────────────────────────────────────────
    // Priority 1: Top 5 European leagues + CL/PT1/NL1
    const topMatches = await matchService.getMatchesForDate(today, 'football', DAILY_TICKET_LEAGUES);

    // Priority 2: Secondary leagues (only used to fill remaining slots)
    let matches = topMatches;
    if (matches.length < DAILY_MATCH_COUNT) {
      const extra = await matchService.getMatchesForDate(today, 'football', FALLBACK_LEAGUES);
      // Add fallback matches only to fill remaining slots; keep top matches first
      matches = [...topMatches, ...extra];
    }

    // NO "all leagues" fallback — prefer returning an error over bizarre matches

    // Filter to scheduled matches with odds (deduplicate by id)
    // Top-league matches are sorted first naturally (topMatches come first in array)
    const seen = new Set<string>();
    const available = matches
      .filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return m.status === 'scheduled' && m.odds;
      })
      .slice(0, 10); // top 10 candidates

    if (available.length < DAILY_MATCH_COUNT) {
      return NextResponse.json(
        { error: 'Pas assez de matchs disponibles aujourd\'hui pour générer le ticket', available: available.length },
        { status: 503 }
      );
    }

    // Detect data source: real API matches have id starting with "apif-"; AI-generated have "openclaw-"
    const hasRealApiMatches = available.some(m => m.id.startsWith('apif-'));
    const dataSource = hasRealApiMatches ? 'api-football' : 'ai-fallback';
    if (!hasRealApiMatches) {
      console.warn('[ticket-du-jour] No real API matches found — generating from AI fallback data');
    }

    // Select the top DAILY_MATCH_COUNT matches
    const selected = available.slice(0, DAILY_MATCH_COUNT);

    // ── 3. Fetch real stats ──────────────────────────────────────────────────
    const footballApiKey = process.env.API_FOOTBALL_KEY;
    const statsMap = await fetchStatsForMatches(
      selected.map(m => ({ 
        ...m, 
        odds: { 
          home: m.odds!.home, 
          draw: m.odds!.draw || 3.3, 
          away: m.odds!.away 
        }, 
        country: m.country 
      })),
      footballApiKey
    ).catch(() => new Map<string, MatchStats>());

    // ── 4. Build picks ───────────────────────────────────────────────────────
    const picks = selected.map(m => {
      const pick = pickForMatch(
        { 
          ...m, 
          odds: { 
            home: m.odds!.home, 
            draw: m.odds!.draw || 3.3, 
            away: m.odds!.away 
          } 
        },
        statsMap.get(m.id)
      );
      return {
        matchId: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league,
        kickoffTime: `${m.date} ${m.time}`.trim(),
        selection: pick,
      };
    });

    const totalOddsRaw = picks.reduce((acc, p) => acc * (p.selection.odds || 1), 1);
    const totalOdds = isNaN(totalOddsRaw) ? 1.00 : Math.round(totalOddsRaw * 100) / 100;
    // Confiance = moyenne des probabilités modèle (quand dispo) ou probabilités implicites
    const confidencePct = Math.round(
      picks.reduce((acc, p) => {
        const pct = p.selection.modelPct ?? p.selection.impliedPct;
        return acc + pct;
      }, 0) / picks.length
    );

    // ── 5. Groq analysis (optional) ──────────────────────────────────────────
    let analysis: object = {};
    try {
      const picksText = picks.map((p, i) =>
        `Match ${i + 1}: ${p.homeTeam} vs ${p.awayTeam} (${p.league})\n  Sélection: ${p.selection.value} @ ${p.selection.odds} (${p.selection.type})`
      ).join('\n\n');

      const prompt = `Analyse le Ticket IA du Jour AlgoPronos avec ces ${picks.length} sélections (cote totale: ${totalOdds}):\n\n${picksText}\n\nRéponds avec ce JSON:\n{"summary": "2 phrases max sur ce ticket du jour", "confidence": "phrase sur la confiance globale", "tip": "1 conseil clé pour le parieur"}`;

      const raw = await callGroq(prompt);
      const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch {
      // Silent fail — ticket still saved without AI analysis
    }

    // ── 6. Save to DB ────────────────────────────────────────────────────────
    const ticket = {
      date: today,
      type: type,
      matches: picks,
      total_odds: totalOdds,
      confidence_pct: confidencePct,
      risk_level: 'balanced',
      analysis,
      status: 'pending',
    };

    let { data: saved, error } = await adminSupabase
      .from('daily_ticket')
      .insert(ticket)
      .select()
      .single();

    // Fallback: if `type` column doesn't exist in the table yet, retry without it
    if (error && (error.code === 'PGRST204' || error.message?.includes('type'))) {
      console.warn('[ticket-du-jour] type column not found, retrying without it');
      const { type: _t, ...ticketNoType } = ticket;
      const fallback = await adminSupabase
        .from('daily_ticket')
        .insert(ticketNoType)
        .select()
        .single();
      saved = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[ticket-du-jour] DB insert error:', error);
      // Return without saving (don't fail the request)
      return NextResponse.json({ ticket: { ...ticket, id: 'temp', created_at: new Date().toISOString() }, fromCache: false });
    }

    return NextResponse.json({ ticket: saved, fromCache: false, dataSource });
  } catch (error) {
    console.error('[ticket-du-jour] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du ticket du jour' }, { status: 500 });
  }
}
