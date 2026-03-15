import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import { notifyAdmin } from '@/lib/services/notification-service';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { identifier, screenshotUrl } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'ID bookmaker requis' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Insertion en base de données
    const { data, error } = await supabase.from('vip_verifications').insert({
      user_id: user.id,
      bookmaker_identifier: identifier,
      screenshot_url: screenshotUrl || null,
      status: 'pending',
    }).select().single();

    if (error) {
      console.error('[VIP Submit] DB Error:', error);
      return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 });
    }

    // 🔥 Alerte Admin
    await notifyAdmin('vip_request', {
      email: user.email,
      identifier: identifier,
      fullName: user.user_metadata?.full_name || 'Utilisateur',
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[VIP Submit] Unexpected error:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
