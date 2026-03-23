import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data: tickets, error } = await supabase
      .from('daily_ticket')
      .select('confidence_pct, status')
      .neq('status', 'pending');

    if (error) throw error;

    // Group by 10% buckets based on confidence_pct
    const buckets: Record<number, { total: number; wins: number }> = {};
    for (let i = 0; i < 10; i++) buckets[i * 10] = { total: 0, wins: 0 };

    (tickets || []).forEach((ticket: any) => {
      const prob   = Number(ticket.confidence_pct);
      const bucket = Math.min(Math.floor(prob / 10) * 10, 90);
      buckets[bucket].total += 1;
      if (ticket.status === 'won') buckets[bucket].wins += 1;
    });

    const calibration = Object.entries(buckets)
      .map(([bucket, stats]) => ({
        prob:   parseInt(bucket) + 5,
        actual: stats.total > 0 ? (stats.wins / stats.total) * 100 : null,
        count:  stats.total,
      }))
      .filter(b => b.actual !== null);

    return NextResponse.json({ calibration });
  } catch (err: any) {
    console.error('[api/performance/calibration] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
