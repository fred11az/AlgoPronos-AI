import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTicketResult, TicketMatch } from '@/lib/services/notification-service';
import { broadcastPush, PushSubscription } from '@/lib/services/push';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Sport keys (mirrors MatchService.ODDS_SPORT_KEY_TO_LEAGUE) ───────────────

const ODDS_SPORT_KEYS = [
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_italy_serie_a',
  'soccer_germany_bundesliga',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
  'soccer_europa_league',
  'soccer_uefa_conference_league',
  'soccer_portugal_primeira_liga',
  'soccer_netherlands_eredivisie',
  'soccer_turkey_super_ligi',
  'soccer_belgium_first_div',
  'soccer_scotland_premiership',
  'soccer_brazil_campeonato',
  'soccer_mexico_ligamx',
  'soccer_usa_mls',
  'soccer_argentina_primera_division',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketMatch_ {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string;
  selection: { type: string; value: string; odds: number; impliedPct: number };
}

interface DailyTicket {
  id: string;
  date: string;
  matches: TicketMatch_[];
  total_odds: number;
  status: string;
}

interface OddsScore {
  name: string;
  score: string;
}

interface OddsEvent {
  id: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  scores: OddsScore[] | null;
}

type ScoreResult = { homeGoals: number; awayGoals: number; finished: boolean };

// ─── The Odds API scores fetch ────────────────────────────────────────────────

async function fetchScoresFromTheOddsAPI(
  daysFrom: number = 3,
): Promise<Map<string, ScoreResult>> {
  const results = new Map<string, ScoreResult>();
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    console.error('[resolve-tickets] THE_ODDS_API_KEY not set — cannot resolve tickets');
    return results;
  }

  const fetches = await Promise.allSettled(
    ODDS_SPORT_KEYS.map(async (sportKey) => {
      const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/scores/`);
      url.searchParams.set('apiKey', apiKey);
      url.searchParams.set('daysFrom', String(daysFrom));
      url.searchParams.set('dateFormat', 'iso');

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`[resolve-tickets] scores ${sportKey} → ${res.status}`);
        return [] as OddsEvent[];
      }
      return res.json() as Promise<OddsEvent[]>;
    })
  );

  for (const result of fetches) {
    if (result.status !== 'fulfilled') continue;
    for (const event of result.value) {
      if (!event.completed || !event.scores?.length) continue;

      const homeScore = event.scores.find((s) => s.name === event.home_team);
      const awayScore = event.scores.find((s) => s.name === event.away_team);
      if (!homeScore || !awayScore) continue;

      results.set(event.id, {
        homeGoals: parseInt(homeScore.score, 10) || 0,
        awayGoals: parseInt(awayScore.score, 10) || 0,
        finished: true,
      });
    }
  }

  console.log(`[resolve-tickets] Scores fetched: ${results.size} completed events across ${ODDS_SPORT_KEYS.length} competitions`);
  return results;
}

// ─── Pick evaluation ──────────────────────────────────────────────────────────

function evaluatePick(
  type: string,
  value: string,
  homeGoals: number,
  awayGoals: number,
): boolean {
  if (type === '1X2') {
    if (value === '1') return homeGoals > awayGoals;
    if (value === 'X') return homeGoals === awayGoals;
    if (value === '2') return awayGoals > homeGoals;
  }
  if (type === 'Double Chance') {
    if (value === '1X') return homeGoals >= awayGoals;
    if (value === 'X2') return awayGoals >= homeGoals;
    if (value === '12') return homeGoals !== awayGoals;
  }
  if (type === 'BTTS') {
    const btts = homeGoals > 0 && awayGoals > 0;
    if (value === 'Oui' || value === 'Yes') return btts;
    if (value === 'Non' || value === 'No') return !btts;
  }
  if (type === 'Over/Under') {
    const total = homeGoals + awayGoals;
    const m = value.match(/^(Over|Under)\s+([\d.]+)$/);
    if (m) {
      const threshold = parseFloat(m[2]);
      return m[1] === 'Over' ? total > threshold : total <= threshold;
    }
  }
  return false;
}

// ─── Main cron handler ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch all pending tickets from before today
  const { data: tickets, error } = await adminSupabase
    .from('daily_ticket')
    .select('*')
    .eq('status', 'pending')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[resolve-tickets] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ resolved: 0, message: 'Aucun ticket en attente' });
  }

  // Fetch all completed scores from The Odds API (single batch, all sport_keys)
  const scoresMap = await fetchScoresFromTheOddsAPI(3);

  const resolved: { id: string; date: string; status: string }[] = [];

  for (const ticket of tickets as DailyTicket[]) {
    try {
      const matches = ticket.matches || [];

      // Ticket age in days (after midnight of the ticket date)
      const ticketAgeDays = Math.floor(
        (Date.now() - new Date(ticket.date + 'T23:59:59Z').getTime()) / (1000 * 60 * 60 * 24)
      );

      let anyResolved = false;
      let anyLost = false;
      let anyVoid = false;

      const enrichedMatches = matches.map((m) => {
        const matchId = m.matchId;

        // Legacy apif- IDs: cannot resolve via The Odds API → void
        if (!matchId || matchId.startsWith('apif-')) {
          anyVoid = true;
          return { ...m, result: 'void', score: null };
        }

        const result = scoresMap.get(matchId);

        if (!result || !result.finished) {
          // Event not yet in scores or not completed
          if (ticketAgeDays < 1) {
            // Match probably hasn't happened yet — skip ticket
            return { ...m, result: 'pending', score: null };
          }
          // Old ticket without a score — void this pick
          anyVoid = true;
          return { ...m, result: 'void', score: null };
        }

        const won = evaluatePick(
          m.selection.type,
          m.selection.value,
          result.homeGoals,
          result.awayGoals,
        );
        if (!won) anyLost = true;
        anyResolved = true;
        return {
          ...m,
          result: won ? 'won' : 'lost',
          score: { home: result.homeGoals, away: result.awayGoals },
        };
      });

      // If any match is still pending (too recent), skip this ticket
      if (enrichedMatches.some((m: any) => m.result === 'pending')) {
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): matches not finished yet — waiting`);
        continue;
      }

      // If nothing resolved and ticket is recent, wait another day
      if (!anyResolved && !anyVoid && ticketAgeDays < 2) {
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): nothing resolved yet, waiting`);
        continue;
      }

      const newStatus = anyLost ? 'lost' : anyVoid ? 'void' : 'won';

      const { error: updateErr } = await adminSupabase
        .from('daily_ticket')
        .update({
          status: newStatus,
          matches: enrichedMatches,
          result_notes: `Résolu automatiquement via The Odds API`,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (updateErr) {
        console.error(`[resolve-tickets] Update error for ${ticket.id}:`, updateErr);
        continue;
      }

      resolved.push({ id: ticket.id, date: ticket.date, status: newStatus });
      console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}) → ${newStatus}`);

      await notifyUsers(adminSupabase, ticket, newStatus);
    } catch (err) {
      console.error(`[resolve-tickets] Error processing ticket ${ticket.id}:`, err);
    }
  }

  return NextResponse.json({
    resolved: resolved.length,
    tickets: resolved,
  });
}

// ─── Notify users ─────────────────────────────────────────────────────────────

async function notifyUsers(
    supabase: any,
  ticket: DailyTicket,
  status: string,
) {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, metadata')
      .not('email', 'is', null);

    if (!profiles?.length) return;

    const eligible = profiles.filter((p: { metadata: Record<string, unknown> | null }) => {
      const meta = p.metadata as Record<string, unknown> | null;
      return !meta || meta.notify_results !== false;
    });

    const notifMatches: TicketMatch[] = ticket.matches.map((m) => ({
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      prediction: `${m.selection.type} ${m.selection.value}`,
      odds: m.selection.odds,
    }));

    const batches: typeof eligible[] = [];
    for (let i = 0; i < eligible.length; i += 10) {
      batches.push(eligible.slice(i, i + 10));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map((p: { email: string; full_name: string | null; phone: string | null }) =>
          notifyTicketResult({
            userEmail: p.email,
            userName: p.full_name ?? undefined,
            userPhone: p.phone ?? undefined,
            date: ticket.date,
            status: status as 'won' | 'lost' | 'void',
            totalOdds: ticket.total_odds,
            matches: notifMatches,
          })
        )
      );
    }

    const allPushSubs: PushSubscription[] = [];
    for (const p of profiles) {
      const meta = p.metadata as Record<string, unknown> | null;
      const subs = meta?.push_subscriptions as PushSubscription[] | undefined;
      if (subs?.length) allPushSubs.push(...subs);
    }

    if (allPushSubs.length > 0) {
      const statusEmoji = status === 'won' ? '✅' : status === 'lost' ? '❌' : '⚪';
      const statusLabel = status === 'won' ? 'GAGNÉ' : status === 'lost' ? 'PERDU' : 'ANNULÉ';
      await broadcastPush(allPushSubs, {
        title: `${statusEmoji} Ticket IA du Jour — ${statusLabel}`,
        body: `Cote totale × ${ticket.total_odds.toFixed(2)} · Voir les détails`,
        url: '/dashboard/history',
        tag: `ticket-result-${ticket.date}`,
        requireInteraction: status === 'won',
      });
    }
  } catch (err) {
    console.error('[resolve-tickets] Notify error:', err);
  }
}
