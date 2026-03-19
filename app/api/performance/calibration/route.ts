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
      .select('result, model_prob')
      .neq('result', 'PENDING');

    if (error) throw error;

    // Group by 10% buckets (0-10, 10-20, ..., 90-100)
    const buckets: Record<number, { total: number; wins: number }> = {};
    for (let i = 0; i < 10; i++) buckets[i * 10] = { total: 0, wins: 0 };

    (picks || []).forEach(pick => {
      const prob = Number(pick.model_prob) * 100;
      const bucket = Math.min(Math.floor(prob / 10) * 10, 90);
      buckets[bucket].total += 1;
      if (pick.result === 'WIN') buckets[bucket].wins += 1;
    });

    const calibration = Object.entries(buckets).map(([bucket, stats]) => ({
      prob: parseInt(bucket) + 5, // Center of bucket
      actual: stats.total > 0 ? (stats.wins / stats.total) * 100 : null,
      count: stats.total
    })).filter(b => b.actual !== null);

    return NextResponse.json({ calibration });
  } catch (err: any) {
    console.error('[api/performance/calibration] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
