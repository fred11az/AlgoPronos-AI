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

    // ── Stats Predictions Log (Dixon-Coles) ──────────────────────────────────
    const { data: predStats } = await adminSupabase
      .from('predictions_log')
      .select('result, bookmaker_odds');

    const predResolved = (predStats || []).filter(p => p.result === 'WIN' || p.result === 'LOSS');
    const predWon      = predResolved.filter(p => p.result === 'WIN');
    
    // Aggregate global stats
    const totalWon      = won.length + predWon.length;
    const totalResolved = resolved.length + predResolved.length;
    
    // Win Rate (Global)
    const winRate = totalResolved > 0
      ? Math.round((totalWon / totalResolved) * 1000) / 10
      : null;

    // ROI Calculation: ((Gains - Mises) / Mises) * 100
    // On assume une mise de 1 unité par prédiction résolue
    const totalGains = predWon.reduce((acc, p) => acc + Number(p.bookmaker_odds), 0) + won.length; // legacy counts Won as 1.0 odds? No, let's just use prediction_log for ROI
    const totalMises = totalResolved;
    const roi = totalResolved > 0 
      ? Math.round(((totalGains - totalMises) / totalMises) * 1000) / 10
      : null;

    const stats = {
      total_won:      totalWon,
      total_resolved: totalResolved,
      win_rate_pct:   winRate,
      roi_pct:        roi,
      avg_odds:       avgOdds, // keep legacy avg odds for now
      total_tickets:  (totalCount ?? 0) + (predStats?.length ?? 0),
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
