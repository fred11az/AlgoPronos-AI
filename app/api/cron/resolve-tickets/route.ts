import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTicketResult, TicketMatch } from '@/lib/services/notification-service';
import { broadcastPush, PushSubscription } from '@/lib/services/push';
import {
  ScoreIndex,
  ScoreResult,
  TicketPick,
  massEmailWarnPct,
  resolveTicketMatches,
  shouldNotifyUsers,
  teamPairKey,
} from '@/lib/services/ticket-resolution';

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

// Groupes non-foot dont les clés actives sont récupérées dynamiquement :
// les tickets Montante/Optimus peuvent contenir du tennis, basket ou MMA.
const EXTRA_SPORT_GROUPS = ['Tennis', 'Basketball', 'Mixed Martial Arts'];
const MAX_SPORT_KEYS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyTicket {
  id: string;
  date: string;
  matches: TicketPick[];
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

// ─── The Odds API scores fetch ────────────────────────────────────────────────

/**
 * Liste des sports actifs à interroger : whitelist foot + clés actives
 * tennis/basket/MMA (endpoint /sports gratuit, ne consomme pas le quota scores).
 */
async function fetchActiveSportKeys(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`/sports → ${res.status}`);
    const sports = (await res.json()) as { key: string; group: string; active: boolean }[];

    const active = new Set(sports.filter((s) => s.active).map((s) => s.key));
    const soccer = ODDS_SPORT_KEYS.filter((k) => active.has(k));
    const extras = sports
      .filter((s) => s.active && EXTRA_SPORT_GROUPS.includes(s.group))
      .map((s) => s.key);

    const keys = [...soccer, ...extras].slice(0, MAX_SPORT_KEYS);
    console.log(`[resolve-tickets] Sport keys actifs: ${keys.length} (foot: ${soccer.length}, autres: ${extras.length})`);
    return keys;
  } catch (err) {
    console.warn('[resolve-tickets] /sports indisponible — fallback whitelist foot:', err);
    return ODDS_SPORT_KEYS;
  }
}

/**
 * Récupère les scores terminés et les indexe de deux façons :
 * - par event id (les tickets récents stockent parfois l'id brut ou préfixé)
 * - par paire d'équipes normalisée (couvre les matchId au format slug — cause
 *   du bug d'annulation quotidienne : le lookup par id seul échouait toujours)
 */
async function fetchScoresFromTheOddsAPI(daysFrom: number = 3): Promise<ScoreIndex> {
  const index: ScoreIndex = { byId: new Map(), byTeams: new Map() };
  const apiKey = process.env.THE_ODDS_API_KEY;

  if (!apiKey) {
    console.error('[resolve-tickets] THE_ODDS_API_KEY not set — cannot resolve tickets');
    return index;
  }

  const sportKeys = await fetchActiveSportKeys(apiKey);

  const fetches = await Promise.allSettled(
    sportKeys.map(async (sportKey) => {
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

      const score: ScoreResult = {
        homeGoals: parseInt(homeScore.score, 10) || 0,
        awayGoals: parseInt(awayScore.score, 10) || 0,
        finished: true,
      };
      index.byId.set(event.id, score);
      index.byTeams.set(teamPairKey(event.home_team, event.away_team), score);
    }
  }

  console.log(`[resolve-tickets] Scores fetched: ${index.byId.size} completed events across ${sportKeys.length} competitions`);
  return index;
}

// ─── Main cron handler ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runStart = Date.now();
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
    console.log('[resolve-tickets] RUN SUMMARY — aucun ticket en attente, 0 email envoyé');
    return NextResponse.json({ resolved: 0, message: 'Aucun ticket en attente' });
  }

  // Fetch all completed scores from The Odds API (single batch, all sport_keys)
  const scoreIndex = await fetchScoresFromTheOddsAPI(3);

  const resolved: { id: string; date: string; status: string; reason: string }[] = [];
  const counts = { won: 0, lost: 0, void: 0, waiting: 0, emailsSent: 0, notifiedTickets: 0 };

  for (const ticket of tickets as DailyTicket[]) {
    try {
      const matches = ticket.matches || [];

      // Ticket age in days (after midnight of the ticket date)
      const ticketAgeDays = Math.floor(
        (Date.now() - new Date(ticket.date + 'T23:59:59Z').getTime()) / (1000 * 60 * 60 * 24)
      );

      const { status: newStatus, enrichedMatches, reason } = resolveTicketMatches(
        matches,
        scoreIndex,
        ticketAgeDays,
      );

      if (newStatus === 'pending') {
        counts.waiting++;
        console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}): en attente — ${reason}`);
        continue;
      }

      const { error: updateErr } = await adminSupabase
        .from('daily_ticket')
        .update({
          status: newStatus,
          matches: enrichedMatches,
          result_notes: newStatus === 'void'
            ? `Annulé automatiquement: ${reason}`
            : 'Résolu automatiquement via The Odds API',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (updateErr) {
        console.error(`[resolve-tickets] Update error for ${ticket.id}:`, updateErr);
        continue;
      }

      counts[newStatus]++;
      resolved.push({ id: ticket.id, date: ticket.date, status: newStatus, reason });
      console.log(`[resolve-tickets] Ticket ${ticket.id} (${ticket.date}) → ${newStatus} (${reason})`);

      // Notification UNIQUEMENT sur résultat réel (gagné/perdu).
      // Un ticket void ne doit JAMAIS déclencher d'email de masse — c'était le
      // bug: 100% des tickets passaient void et 100% des profils étaient emailés.
      if (shouldNotifyUsers(newStatus)) {
        const { emailsSent } = await notifyUsers(adminSupabase, ticket, newStatus);
        counts.emailsSent += emailsSent;
        counts.notifiedTickets++;
      } else {
        console.log(`[resolve-tickets] Ticket ${ticket.id} → ${newStatus}: AUCUNE notification envoyée (politique void)`);
      }
    } catch (err) {
      console.error(`[resolve-tickets] Error processing ticket ${ticket.id}:`, err);
    }
  }

  const summary = {
    resolved: resolved.length,
    won: counts.won,
    lost: counts.lost,
    void: counts.void,
    waiting: counts.waiting,
    notifiedTickets: counts.notifiedTickets,
    emailsSent: counts.emailsSent,
    durationMs: Date.now() - runStart,
  };
  console.log(`[resolve-tickets] RUN SUMMARY — ${JSON.stringify(summary)}`);

  return NextResponse.json({ ...summary, tickets: resolved });
}

// ─── Notify users ─────────────────────────────────────────────────────────────

async function notifyUsers(
  supabase: any,
  ticket: DailyTicket,
  status: string,
): Promise<{ emailsSent: number }> {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, metadata')
      .not('email', 'is', null);

    if (!profiles?.length) return { emailsSent: 0 };

    const eligible = profiles.filter((p: { metadata: Record<string, unknown> | null }) => {
      const meta = p.metadata as Record<string, unknown> | null;
      return !meta || meta.notify_results !== false;
    });

    // Garde-fou anti-email de masse : trace toujours le volume, warning au-delà
    // du seuil (MASS_EMAIL_WARN_PCT, défaut 50%). L'envoi des résultats à tous
    // les opt-in est voulu, mais le volume doit être visible dans les logs.
    const pct = Math.round((eligible.length / profiles.length) * 100);
    console.log(`[resolve-tickets] Notification ${status} ticket ${ticket.date}: ${eligible.length}/${profiles.length} profils éligibles (${pct}%)`);
    if (pct > massEmailWarnPct()) {
      console.warn(`[resolve-tickets] ⚠️ GARDE-FOU: envoi à ${pct}% des utilisateurs (> ${massEmailWarnPct()}%) — vérifier que c'est intentionnel (statut: ${status})`);
    }

    const notifMatches: TicketMatch[] = ticket.matches.map((m) => ({
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      prediction: `${m.selection.type} ${m.selection.value}`,
      odds: m.selection.odds,
    }));

    let emailsSent = 0;
    const batches: typeof eligible[] = [];
    for (let i = 0; i < eligible.length; i += 10) {
      batches.push(eligible.slice(i, i + 10));
    }

    for (const batch of batches) {
      const results = await Promise.all(
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
      emailsSent += results.filter((r) => r.email).length;
    }

    console.log(`[resolve-tickets] Emails envoyés: ${emailsSent}/${eligible.length} (ticket ${ticket.date}, statut ${status})`);

    const allPushSubs: PushSubscription[] = [];
    for (const p of profiles) {
      const meta = p.metadata as Record<string, unknown> | null;
      const subs = meta?.push_subscriptions as PushSubscription[] | undefined;
      if (subs?.length) allPushSubs.push(...subs);
    }

    if (allPushSubs.length > 0) {
      const statusEmoji = status === 'won' ? '✅' : '❌';
      const statusLabel = status === 'won' ? 'GAGNÉ' : 'PERDU';
      await broadcastPush(allPushSubs, {
        title: `${statusEmoji} Ticket IA du Jour — ${statusLabel}`,
        body: `Cote totale × ${ticket.total_odds.toFixed(2)} · Voir les détails`,
        url: '/dashboard/history',
        tag: `ticket-result-${ticket.date}`,
        requireInteraction: status === 'won',
      });
    }

    return { emailsSent };
  } catch (err) {
    console.error('[resolve-tickets] Notify error:', err);
    return { emailsSent: 0 };
  }
}
