import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get('page')  || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const { data: tickets, count, error } = await supabase
      .from('daily_ticket')
      .select('*', { count: 'exact' })
      .neq('status', 'pending')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Flatten each ticket's matches into individual pick rows
    // so PicksHistory component can render them in its table
    const picks = (tickets || []).flatMap((ticket: any) =>
      ((ticket.matches as any[]) || []).map((m: any, i: number) => ({
        id:             `${ticket.id}_${i}`,
        created_at:     ticket.created_at,
        home_team:      m.homeTeam  || m.home_team  || '–',
        away_team:      m.awayTeam  || m.away_team  || '–',
        market:         m.selection?.type  || m.prediction_type || 'unknown',
        bookmaker_odds: m.selection?.odds  || m.recommended_odds || 1,
        value_edge:     0,
        result:
          m.result === 'won'  ? 'WIN'
          : m.result === 'lost' ? 'LOSS'
          : 'PENDING',
      }))
    );

    return NextResponse.json({
      picks,
      total:      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err: any) {
    console.error('[api/performance/history] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
