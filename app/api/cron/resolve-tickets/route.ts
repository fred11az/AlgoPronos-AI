import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTicketResult, TicketMatch } from '@/lib/services/notification-service';
import { broadcastPush, PushSubscription } from '@/lib/services/push';
import { cachedFetch } from '@/lib/services/api/footballApi';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

interface APIFootballFixture {
  fixture: { id: number; status: { short: string } };
  goals: { home: number | null; away: number | null };
}

// ─── API-Football result fetch ────────────────────────────────────────────────

async function fetchFixtureResults(
  fixtureIds: number[],
): Promise<Map<number, { homeGoals: number; awayGoals: number; finished: boolean }>> {
  const results = new Map<number, { homeGoals: number; awayGoals: number; finished: boolean }>();
  if (fixtureIds.length === 0) return results;

  // Use cachedFetch (RapidAPI) — results cache TTL short (5 min) for live score accuracy
  const ids = fixtureIds.join('-');
  const data = await cachedFetch<any>('/fixtures', { ids }, 300);

  if (!data) {
    console.error('[resolve-tickets] cachedFetch returned null for /fixtures');
    return results;
  }

  const FINISHED = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

  for (const item of (data.response ?? []) as APIFootballFixture[]) {
    const fid = item.fixture.id;
    const finished = FINISHED.includes(item.fixture.status.short);
    const homeGoals = item.goals.home ?? 0;
    const awayGoals = item.goals.away ?? 0;
    results.set(fid, { homeGoals, awayGoals, finished });
  }

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
  // Verify cron secret (Vercel injects Authorization: Bearer {CRON_SECRET} automatically)
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not set' }, { status: 500 });
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

  const resolved: { id: string; date: string; status: string }[] = [];

  for (const ticket of tickets as DailyTicket[]) {
    try {
      const matches = ticket.matches || [];

      // Extract API-Football fixture IDs (format: "apif-12345")
      const fixtureIds = matches
        .map(m => {
          const match = m.matchId?.match(/^apif-(\d+)$/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((id): id is number => id !== null);

      // Ticket age in days (after midnight of the ticket date)
      const ticketAgeDays = Math.floor(
        (Date.now() - new Date(ticket.date + 'T23:59:59Z').getTime()) / (1000 * 60 * 60 * 24)
      );

      // Fetch results from API-Football for all apif- fixture IDs we found
      const fixtureResults = await fetchFixtureResults(fixtureIds);

      // Check if any resolvable apif matches are still not finished
      const unresolvedApif = fixtureIds.filter(id => !fixtureResults.get(id)?.finished);
      if (unresolvedApif.length > 0 && ticketAgeDays < 1) {
        // Matches not finished yet and ticket is recent — wait
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): ${unresolvedApif.length} match(es) not finished yet`);
        continue;
      }

      // Evaluate each pick — non-apif IDs get marked void individually
      let anyResolved = false;
      let anyLost = false;
      let anyVoid = false;

      const enrichedMatches = matches.map((m) => {
        const apifMatch = m.matchId?.match(/^apif-(\d+)$/);
        if (!apifMatch) {
          // Non-apif ID: cannot auto-resolve this pick
          anyVoid = true;
          return { ...m, result: 'void', score: null };
        }
        const fid = parseInt(apifMatch[1]);
        const result = fixtureResults.get(fid);
        if (!result || !result.finished) {
          // Still not finished or missing — treat as void for old tickets
          anyVoid = true;
          return { ...m, result: 'void', score: null };
        }
        const won = evaluatePick(m.selection.type, m.selection.value, result.homeGoals, result.awayGoals);
        if (!won) anyLost = true;
        anyResolved = true;
        return {
          ...m,
          result: won ? 'won' : 'lost',
          score: { home: result.homeGoals, away: result.awayGoals },
        };
      });

      // If nothing could be resolved and ticket is recent, wait
      if (!anyResolved && !anyVoid && ticketAgeDays < 2) {
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): nothing resolved yet, waiting`);
        continue;
      }

      // Overall status: lost if any pick lost, void if any pick unresolvable + none lost, won only if all resolved + won
      const newStatus = anyLost ? 'lost' : (anyVoid ? 'void' : 'won');

      // Update ticket in DB with enriched matches + global status
      const { error: updateErr } = await adminSupabase
        .from('daily_ticket')
        .update({
          status: newStatus,
          matches: enrichedMatches,
          result_notes: `Résolu automatiquement via API-Football`,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (updateErr) {
        console.error(`[resolve-tickets] Update error for ${ticket.id}:`, updateErr);
        continue;
      }

      resolved.push({ id: ticket.id, date: ticket.date, status: newStatus });
      console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}) → ${newStatus}`);

      // Notify users (email + WhatsApp + push)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const notifMatches: TicketMatch[] = ticket.matches.map(m => ({
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      prediction: `${m.selection.type} ${m.selection.value}`,
      odds: m.selection.odds,
    }));

    // Email + WhatsApp notifications
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

    // Web push notifications
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
