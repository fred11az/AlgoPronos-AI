import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const league = searchParams.get('league') || 'all';
  const market = searchParams.get('market') || 'all';
  
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('predictions_log')
      .select('*', { count: 'exact' })
      .neq('result', 'PENDING')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (league !== 'all') {
      // Note: we might need to join or store league_id in predictions_log
      // For now, assume we'll add filtering when league metadata is available
    }

    if (market !== 'all') {
      query = query.eq('market', market);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      picks: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err: any) {
    console.error('[api/performance/history] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
