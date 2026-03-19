import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: picks, error } = await supabase
      .from('predictions_log')
      .select('result, bookmaker_odds, value_edge')
      .neq('result', 'PENDING')
      .gte('created_at', sixMonthsAgo.toISOString());

    if (error) throw error;

    const total = picks.length;
    const wins = picks.filter(p => p.result === 'WIN').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    // ROI: ((Total Gains - Total Stakes) / Total Stakes) * 100
    // Stake = 1 unit per pick
    const totalGains = picks.filter(p => p.result === 'WIN').reduce((acc, p) => acc + Number(p.bookmaker_odds), 0);
    const roi = total > 0 ? ((totalGains - total) / total) * 100 : 0;
    
    const avgOdds = total > 0 ? picks.reduce((acc, p) => acc + Number(p.bookmaker_odds), 0) / total : 0;

    return NextResponse.json({
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      avgOdds: Math.round(avgOdds * 100) / 100,
      totalPicks: total
    });
  } catch (err: any) {
    console.error('[api/performance/stats] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
