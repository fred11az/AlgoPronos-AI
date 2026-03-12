import { NextResponse } from 'next/server';
import { getCurrentUser, checkIsAdmin, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/generate-ticket
// Supprime le ticket du jour en cours (si présent) et force la régénération via /api/ticket-du-jour
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Supprime le ticket du jour existant pour forcer la régénération
  await adminSupabase.from('daily_ticket').delete().eq('date', today);

  // Vide aussi le cache matchs du jour pour forcer un fresh fetch API-Football
  await adminSupabase.from('matches_cache').delete().eq('date', today);

  // Appelle GET /api/ticket-du-jour pour régénérer
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/ticket-du-jour`);
  const data = await res.json();

  if (!res.ok || !data?.ticket) {
    return NextResponse.json(
      { error: data?.error || 'Échec de la génération du ticket', details: data },
      { status: res.status || 500 }
    );
  }

  return NextResponse.json({ success: true, ticket: data.ticket });
}
