import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { data: picks, error } = await supabase
      .from('predictions_log')
      .select('result, bookmaker_odds, resolved_at')
      .neq('result', 'PENDING')
      .order('resolved_at', { ascending: true });

    if (error) throw error;

    let cumulativeGains = 0;
    let cumulativeStakes = 0;
    
    const curve = (picks || []).map((pick, index) => {
      cumulativeStakes += 1;
      if (pick.result === 'WIN') {
        cumulativeGains += Number(pick.bookmaker_odds);
      }
      
      const pnl = cumulativeGains - cumulativeStakes;
      const roi = (cumulativeStakes > 0) 
        ? (pnl / cumulativeStakes) * 100 
        : 0;

      return {
        date: pick.resolved_at,
        roi: Math.round(roi * 10) / 10,
        pnl: Math.round(pnl * 100) / 100,
        index: index + 1
      };
    });

    return NextResponse.json({ curve });
  } catch (err: any) {
    console.error('[api/performance/curve] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
