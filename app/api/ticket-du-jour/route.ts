import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchService } from '@/lib/services/match-service';
import { fetchStatsForMatches, type MatchStats } from '@/lib/services/stats-service';

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
): { type: string; value: string; odds: number; impliedPct: number; reasoning: string | null } {
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

  addCandidate('1X2', '1', ho, stats?.homePct ?? null);
  addCandidate('1X2', 'X', dr, stats?.drawPct ?? null);
  addCandidate('1X2', '2', aw, stats?.awayPct ?? null);
  addCandidate('Double Chance', '1X', dc1X, stats ? stats.homePct + stats.drawPct : null);
  addCandidate('Double Chance', 'X2', dcX2, stats ? stats.drawPct + stats.awayPct : null);

  // Priorité aux picks de qualité supérieure (impliedPct ≥ MIN_PICK_IMPLIED_PCT)
  // Score : favorise la probabilité implicite élevée + edge positif, cibles cotes 1.40–1.80
  const safePool = candidates.filter(c => c.impliedPct >= MIN_PICK_IMPLIED_PCT);
  const pool = safePool.length >= 1 ? safePool : candidates;

  const best = pool.reduce((a, b) => {
    const score = (c: PickCandidate) =>
      c.impliedPct * 2
      + (c.valueEdge ?? 0) * 1.5
      - Math.abs(c.odds - 1.60) * 0.5;
    return score(b) > score(a) ? b : a;
  }, pool[0]);

  return {
    type: best.type,
    value: best.value,
    odds: best.odds,
    impliedPct: best.impliedPct,
    reasoning: stats?.advice ? `Conseil API-Football: "${stats.advice}"` : null,
  };
}

// ─── Groq explanation ─────────────────────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Tu es AlgoPronos AI, analyste sportif expert. Génère une analyse courte et percutante pour le Ticket IA du Jour. Réponds UNIQUEMENT en JSON valide.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    }),
  });

  if (!response.ok) return '';
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ─── Main: GET ────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // ── 1. Return cached daily ticket if exists ──────────────────────────────
    const { data: existing } = await adminSupabase
      .from('daily_ticket')
      .select('*')
      .eq('date', today)
      .single();

    if (existing) {
      return NextResponse.json({ ticket: existing, fromCache: true });
    }

    // ── 2. Fetch today's matches ─────────────────────────────────────────────
    let matches = await matchService.getMatchesForDate(today, DAILY_TICKET_LEAGUES);

    if (matches.length < DAILY_MATCH_COUNT) {
      const extra = await matchService.getMatchesForDate(today, FALLBACK_LEAGUES);
      matches = [...matches, ...extra];
    }

    // Filter to scheduled matches with odds
    const available = matches
      .filter(m => m.status === 'scheduled' && m.odds)
      .slice(0, 10); // top 10 candidates

    if (available.length < DAILY_MATCH_COUNT) {
      return NextResponse.json(
        { error: 'Pas assez de matchs disponibles aujourd\'hui pour générer le ticket', available: available.length },
        { status: 503 }
      );
    }

    // Select the top DAILY_MATCH_COUNT matches
    const selected = available.slice(0, DAILY_MATCH_COUNT);

    // ── 3. Fetch real stats ──────────────────────────────────────────────────
    const footballApiKey = process.env.FOOTBALL_API_KEY;
    const statsMap = await fetchStatsForMatches(
      selected.map(m => ({ ...m, odds: m.odds!, country: m.country })),
      footballApiKey
    ).catch(() => new Map<string, MatchStats>());

    // ── 4. Build picks ───────────────────────────────────────────────────────
    const picks = selected.map(m => {
      const pick = pickForMatch(
        { ...m, odds: m.odds! },
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

    const totalOdds = Math.round(picks.reduce((acc, p) => acc * p.selection.odds, 1) * 100) / 100;
    // Confiance = moyenne des probabilités implicites par pick (affichage clair, jamais < 55%)
    const confidencePct = Math.round(
      picks.reduce((acc, p) => acc + p.selection.impliedPct, 0) / picks.length
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
      matches: picks,
      total_odds: totalOdds,
      confidence_pct: confidencePct,
      risk_level: 'balanced',
      analysis,
      status: 'pending',
    };

    const { data: saved, error } = await adminSupabase
      .from('daily_ticket')
      .insert(ticket)
      .select()
      .single();

    if (error) {
      console.error('[ticket-du-jour] DB insert error:', error);
      // Return without saving (don't fail the request)
      return NextResponse.json({ ticket: { ...ticket, id: 'temp', created_at: new Date().toISOString() }, fromCache: false });
    }

    return NextResponse.json({ ticket: saved, fromCache: false });
  } catch (error) {
    console.error('[ticket-du-jour] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du ticket du jour' }, { status: 500 });
  }
}
