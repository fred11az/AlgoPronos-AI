import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data: tickets, error } = await supabase
      .from('daily_ticket')
      .select('status, total_odds, created_at')
      .in('status', ['won', 'lost', 'void']);

    if (error) throw error;

    const won  = (tickets || []).filter(t => t.status === 'won');
    const lost = (tickets || []).filter(t => t.status === 'lost');
    const resolved = won.length + lost.length;

    const winRate = resolved > 0 ? (won.length / resolved) * 100 : 0;

    const wonOdds = won.map(t => Number(t.total_odds)).filter(o => o > 0);
    const totalGains = wonOdds.reduce((acc, o) => acc + o, 0);
    const roi = resolved > 0 ? ((totalGains - resolved) / resolved) * 100 : 0;

    const allOdds = [...won, ...lost].map(t => Number(t.total_odds)).filter(o => o > 0);
    const avgOdds = allOdds.length > 0
      ? allOdds.reduce((a, b) => a + b, 0) / allOdds.length
      : 0;

    return NextResponse.json({
      winRate:    Math.round(winRate  * 10)  / 10,
      roi:        Math.round(roi      * 10)  / 10,
      avgOdds:    Math.round(avgOdds  * 100) / 100,
      totalPicks: tickets?.length ?? 0,   // all resolved (won+lost+void)
      totalResolved: resolved,             // won+lost only (used in win rate)
    });
  } catch (err: any) {
    console.error('[api/performance/stats] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
