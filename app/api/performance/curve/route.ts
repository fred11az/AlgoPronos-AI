import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data: tickets, error } = await supabase
      .from('daily_ticket')
      .select('status, total_odds, date')
      .in('status', ['won', 'lost'])
      .order('date', { ascending: true });

    if (error) throw error;

    let cumulativeGains = 0;
    let cumulativeStakes = 0;

    const curve = (tickets || []).map((ticket) => {
      cumulativeStakes += 1;
      if (ticket.status === 'won') {
        cumulativeGains += Number(ticket.total_odds) || 0;
      }
      const pnl = cumulativeGains - cumulativeStakes;
      const roi = cumulativeStakes > 0 ? (pnl / cumulativeStakes) * 100 : 0;
      return {
        date: ticket.date,
        roi:  Math.round(roi * 10)  / 10,
        pnl:  Math.round(pnl * 100) / 100,
        index: cumulativeStakes,
      };
    });

    return NextResponse.json({ curve });
  } catch (err: any) {
    console.error('[api/performance/curve] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
