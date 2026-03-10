import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/history — historique des tickets IA du jour + stats globales
export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // ── Stats all-time (pas de limite) ──────────────────────────────────────
    // On récupère seulement status + total_odds pour ne pas surcharger la requête
    const { data: allForStats, count: totalCount } = await adminSupabase
      .from('daily_ticket')
      .select('status, total_odds', { count: 'exact' })
      .lte('date', today);

    type StatRow = { status: string; total_odds: number | string };
    const resolved = (allForStats || [] as StatRow[]).filter((t: StatRow) => t.status === 'won' || t.status === 'lost');
    const won      = resolved.filter((t: StatRow) => t.status === 'won');
    const lost     = resolved.filter((t: StatRow) => t.status === 'lost');
    const voided   = (allForStats || [] as StatRow[]).filter((t: StatRow) => t.status === 'void');

    const winRate = resolved.length > 0
      ? Math.round((won.length / resolved.length) * 1000) / 10
      : null;

    const avgOdds = resolved.length > 0
      ? Math.round(resolved.reduce((acc: number, t: StatRow) => acc + Number(t.total_odds), 0) / resolved.length * 100) / 100
      : null;

    const bestWinOdds = won.length > 0
      ? Math.max(...won.map((t: StatRow) => Number(t.total_odds)))
      : null;

    const stats = {
      total_won:      won.length,
      total_lost:     lost.length,
      total_void:     voided.length,
      total_resolved: resolved.length,
      win_rate_pct:   winRate,
      avg_odds:       avgOdds,
      best_win_odds:  bestWinOdds,
      total_tickets:  totalCount ?? (allForStats || []).length,
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
