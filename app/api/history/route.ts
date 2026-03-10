import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/history — historique des tickets IA du jour + stats globales
export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Compte total réel (sans limit)
    const { count: totalCount } = await adminSupabase
      .from('daily_ticket')
      .select('*', { count: 'exact', head: true })
      .or(`date.lt.${today},and(date.eq.${today},status.in.(won,lost,void))`);

    // Tickets passés + aujourd'hui si déjà résolu (30 derniers pour l'affichage)
    const { data: tickets, error } = await adminSupabase
      .from('daily_ticket')
      .select('*')
      .or(`date.lt.${today},and(date.eq.${today},status.in.(won,lost,void))`)
      .order('date', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[history] Error fetching tickets:', error);
      return NextResponse.json({ tickets: [], stats: null });
    }

    type Ticket = { status: string; total_odds: number | string };

    // Compute stats from tickets
    const resolved = (tickets || [] as Ticket[]).filter((t: Ticket) => t.status === 'won' || t.status === 'lost');
    const won = resolved.filter((t: Ticket) => t.status === 'won');
    const lost = resolved.filter((t: Ticket) => t.status === 'lost');
    const voided = (tickets || [] as Ticket[]).filter((t: Ticket) => t.status === 'void');

    const winRate = resolved.length > 0
      ? Math.round((won.length / resolved.length) * 1000) / 10
      : null;

    const avgOdds = resolved.length > 0
      ? Math.round(resolved.reduce((acc: number, t: Ticket) => acc + Number(t.total_odds), 0) / resolved.length * 100) / 100
      : null;

    const bestWinOdds = won.length > 0
      ? Math.max(...won.map((t: Ticket) => Number(t.total_odds)))
      : null;

    const stats = {
      total_won: won.length,
      total_lost: lost.length,
      total_void: voided.length,
      total_resolved: resolved.length,
      win_rate_pct: winRate,
      avg_odds: avgOdds,
      best_win_odds: bestWinOdds,
      total_tickets: totalCount ?? (tickets || []).length,
    };

    return NextResponse.json({ tickets: tickets || [], stats });
  } catch (error) {
    console.error('[history] Unexpected error:', error);
    return NextResponse.json({ tickets: [], stats: null });
  }
}
