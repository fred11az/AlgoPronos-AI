import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTicketResult, TicketMatch } from '@/lib/services/notification-service';

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
  apiKey: string,
): Promise<Map<number, { homeGoals: number; awayGoals: number; finished: boolean }>> {
  const results = new Map<number, { homeGoals: number; awayGoals: number; finished: boolean }>();
  if (fixtureIds.length === 0) return results;

  // API-Football allows multiple ids in one call (up to ~20)
  const ids = fixtureIds.join('-');
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?ids=${ids}`,
    { headers: { 'x-apisports-key': apiKey } }
  );

  if (!res.ok) {
    console.error(`[resolve-tickets] API-Football error: ${res.status}`);
    return results;
  }

  const data = await res.json();
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

  const footballApiKey = process.env.FOOTBALL_API_KEY;
  if (!footballApiKey) {
    return NextResponse.json({ error: 'FOOTBALL_API_KEY not set' }, { status: 500 });
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

      if (fixtureIds.length !== matches.length) {
        // Some matches have non-apif IDs — can't auto-resolve
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}) has non-APIF matches, skipping`);
        continue;
      }

      // Fetch results from API-Football
      const fixtureResults = await fetchFixtureResults(fixtureIds, footballApiKey);

      // Check all matches are finished
      const allFinished = fixtureIds.every(id => fixtureResults.get(id)?.finished);
      if (!allFinished) {
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): not all matches finished yet`);
        continue;
      }

      // Evaluate each pick
      let allWon = true;
      let anyLost = false;

      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const fid = fixtureIds[i];
        const result = fixtureResults.get(fid);
        if (!result) { allWon = false; break; }

        const won = evaluatePick(m.selection.type, m.selection.value, result.homeGoals, result.awayGoals);
        if (!won) anyLost = true;
      }

      const newStatus = anyLost ? 'lost' : (allWon ? 'won' : 'void');

      // Update ticket in DB
      const { error: updateErr } = await adminSupabase
        .from('daily_ticket')
        .update({
          status: newStatus,
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

      // Notify users
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
  } catch (err) {
    console.error('[resolve-tickets] Notify error:', err);
  }
}
