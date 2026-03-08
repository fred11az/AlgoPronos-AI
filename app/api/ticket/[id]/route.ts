import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Public ticket fetch — no auth required
// Resolves both daily tickets and generated combines by UUID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const adminSupabase = createAdminClient();

    // Try daily_ticket first
    const { data: daily } = await adminSupabase
      .from('daily_ticket')
      .select('id, date, matches, total_odds, confidence_pct, risk_level, status, analysis, created_at')
      .eq('id', id)
      .single();

    if (daily) {
      return NextResponse.json({
        type: 'daily',
        ticket: {
          id: daily.id,
          date: daily.date,
          matches: daily.matches,
          total_odds: Number(daily.total_odds),
          confidence_pct: daily.confidence_pct,
          risk_level: daily.risk_level,
          status: daily.status,
          analysis: daily.analysis,
          created_at: daily.created_at,
        },
      });
    }

    // Try generated combine
    const { data: combine } = await adminSupabase
      .from('generated_combines')
      .select('id, matches, total_odds, estimated_probability, parameters, created_at, status')
      .eq('id', id)
      .single();

    if (combine) {
      return NextResponse.json({
        type: 'combine',
        ticket: {
          id: combine.id,
          date: combine.created_at?.split('T')[0],
          matches: combine.matches,
          total_odds: Number(combine.total_odds),
          confidence_pct: combine.estimated_probability,
          risk_level: (combine.parameters as { riskLevel?: string } | null)?.riskLevel || 'balanced',
          status: combine.status || 'pending',
          created_at: combine.created_at,
        },
      });
    }

    return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
  } catch (err) {
    console.error('[ticket/:id]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
