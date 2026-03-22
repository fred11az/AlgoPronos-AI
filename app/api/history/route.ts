import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/history — historique des tickets IA du jour + stats globales
export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // ── Stats all-time ───────────────────────────────────────────────────────
    const { data: allForStats, count: totalCount } = await adminSupabase
      .from('daily_ticket')
      .select('status, total_odds', { count: 'exact' })
      .lte('date', today);

    type StatRow = { status: string; total_odds: number | string | null };
    const rows = (allForStats || []) as StatRow[];

    const won    = rows.filter(t => t.status === 'won');
    const lost   = rows.filter(t => t.status === 'lost');
    const voided = rows.filter(t => t.status === 'void');
    // Only won + lost count toward win rate (void excluded)
    const resolved = won.length + lost.length;

    const winRate = resolved > 0
      ? Math.round((won.length / resolved) * 1000) / 10
      : null;

    // Average odds based on all resolved tickets (won + lost)
    const resolvedOdds = [...won, ...lost]
      .map(t => Number(t.total_odds))
      .filter(o => o > 0);
    const avgOdds = resolvedOdds.length > 0
      ? Math.round((resolvedOdds.reduce((a, b) => a + b, 0) / resolvedOdds.length) * 100) / 100
      : null;

    // Best win odds
    const wonOdds = won.map(t => Number(t.total_odds)).filter(o => o > 0);
    const bestWinOdds = wonOdds.length > 0 ? Math.max(...wonOdds) : null;

    const stats = {
      total_won:      won.length,
      total_lost:     lost.length,
      total_void:     voided.length,
      total_resolved: resolved,
      win_rate_pct:   winRate,
      avg_odds:       avgOdds,
      best_win_odds:  bestWinOdds,
      total_tickets:  totalCount ?? 0,
    };

    // ── Tickets pour l'affichage (60 derniers, données complètes) ───────────
    const { data: allTickets, error } = await adminSupabase
      .from('daily_ticket')
      .select('*')
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(60);

    if (error) {
      console.error('[history] Error fetching tickets:', error);
      return NextResponse.json({ tickets: [], stats });
    }

    // Exclut le ticket du jour s'il est encore pending (affiché séparément)
    const tickets = (allTickets || []).filter(
      t => t.date < today || t.status !== 'pending'
    );

    return NextResponse.json({ tickets, stats });
  } catch (error) {
    console.error('[history] Unexpected error:', error);
    return NextResponse.json({ tickets: [], stats: null });
  }
}
