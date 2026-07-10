/**
 * /api/admin/analytics/weekly — CRUD des métriques hebdomadaires d'acquisition.
 * Admin uniquement (session vérifiée) ; la table weekly_metrics n'a aucune
 * policy RLS publique et n'est accessible que via le service role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

const NUMERIC_FIELDS = [
  'ad_budget_fcfa',
  'fb_signups',
  'field_signups',
  'ambassador_salary_fcfa',
  'new_contacts',
  'total_signups',
  'onexbet_accounts',
  'first_deposits',
  'active_players',
  'affiliate_revenue_fcfa',
] as const;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('weekly_metrics')
    .select('*')
    .order('week_start', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ weeks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body?.week_start || !/^\d{4}-\d{2}-\d{2}$/.test(body.week_start)) {
    return NextResponse.json({ error: 'week_start (YYYY-MM-DD) requis' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    week_start: body.week_start,
    notes: typeof body.notes === 'string' ? body.notes : null,
    updated_at: new Date().toISOString(),
  };
  for (const f of NUMERIC_FIELDS) {
    const v = Number(body[f]);
    row[f] = Number.isFinite(v) && v >= 0 ? v : 0;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('weekly_metrics')
    .upsert(row, { onConflict: 'week_start' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ week: data });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('weekly_metrics').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
