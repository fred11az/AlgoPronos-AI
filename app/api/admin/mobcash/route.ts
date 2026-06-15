import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const ok = await checkIsAdmin(user.id);
  return ok ? user : null;
}

/** GET /api/admin/mobcash — liste toutes les demandes */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const page   = parseInt(searchParams.get('page') || '1', 10);
  const limit  = 20;
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();
  let query = supabase
    .from('mobcash_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data, total: count, page, limit });
}

/** PATCH /api/admin/mobcash — met à jour le statut d'une demande */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id, status, admin_notes } = await req.json() as {
    id?: string;
    status?: string;
    admin_notes?: string;
  };

  if (!id || !status) {
    return NextResponse.json({ error: 'id et status requis' }, { status: 400 });
  }

  const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('mobcash_requests')
    .update({
      status,
      admin_notes: admin_notes?.trim() || null,
      processed_by: admin.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
