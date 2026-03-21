import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const ok = await checkIsAdmin(user.id);
  return ok ? user : null;
}

/** GET /api/admin/bookmaker-ids — liste tous les IDs approuvés */
export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_approved_bookmaker_ids')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ids: data });
}

/** POST /api/admin/bookmaker-ids — ajoute un ID */
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { bookmaker, account_id, notes } = await req.json() as {
    bookmaker?: string;
    account_id?: string;
    notes?: string;
  };

  if (!bookmaker || !account_id?.trim()) {
    return NextResponse.json({ error: 'bookmaker et account_id requis' }, { status: 400 });
  }

  const clean = account_id.trim().toLowerCase();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_approved_bookmaker_ids')
    .insert({ bookmaker, account_id: clean, notes: notes?.trim() || null })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet ID est déjà dans la liste.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data });
}

/** DELETE /api/admin/bookmaker-ids — supprime un ID */
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('admin_approved_bookmaker_ids')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
