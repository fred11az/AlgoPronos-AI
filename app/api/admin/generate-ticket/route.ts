import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkIsAdmin, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/generate-ticket?type=classic|optimus|montante
// Supprime le ticket du type demandé et force la régénération via /api/ticket-du-jour
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const type = req.nextUrl.searchParams.get('type') || 'classic';
  if (!['classic', 'optimus', 'montante'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide. Valeurs: classic | optimus | montante' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Supprime uniquement le ticket du type demandé
  await adminSupabase.from('daily_ticket').delete().eq('date', today).eq('type', type);

  // Vide le cache matchs uniquement pour classic et montante (optimus utilise match_predictions)
  if (type !== 'optimus') {
    await adminSupabase.from('matches_cache').delete().eq('date', today);
  }

  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/ticket-du-jour?type=${type}`);
  const data = await res.json();

  if (!res.ok || !data?.ticket) {
    return NextResponse.json(
      { error: data?.error || `Échec de la génération du ticket ${type}`, details: data },
      { status: res.status || 500 }
    );
  }

  return NextResponse.json({ success: true, type, ticket: data.ticket });
}
