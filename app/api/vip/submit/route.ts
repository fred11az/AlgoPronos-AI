import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import { notifyAdmin, notifyActivation } from '@/lib/services/notification-service';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await req.json();
    const { identifier, screenshotUrl } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'ID bookmaker requis' }, { status: 400 });
    }

    const clean = identifier.trim().toLowerCase();
    const supabase = createAdminClient();

    // Verifier si l'ID est deja dans la liste des comptes pre-approuves par l'admin
    const { data: preApproved } = await supabase
      .from('admin_approved_bookmaker_ids')
      .select('id, bookmaker')
      .ilike('account_id', clean)
      .maybeSingle();

    if (preApproved) {
      // ID reconnu -> activer immediatement le Full Access
      const { error: tierError } = await supabase
        .from('profiles')
        .update({ tier: 'verified', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (tierError) {
        console.error('[VIP Submit] Tier update error:', tierError);
        return NextResponse.json({ error: "Erreur lors de l'activation" }, { status: 500 });
      }

      // Enregistrer aussi dans vip_verifications pour tracabilite
      await supabase.from('vip_verifications').upsert({
        user_id: user.id,
        bookmaker_identifier: identifier.trim(),
        screenshot_url: screenshotUrl || null,
        status: 'approved',
        admin_notes: "Auto-approuve - ID pre-enregistre par l'administration",
        verified_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // Notifier l'utilisateur par email
      await notifyActivation({
        userEmail: user.email!,
        userName: user.user_metadata?.full_name,
        userPhone: user.user_metadata?.phone,
      });

      return NextResponse.json({
        success: true,
        auto_approved: true,
        message: 'Votre Full Access a ete active avec succes.',
      });
    }

    // ID non pre-approuve -> demande standard en attente
    const { data, error } = await supabase.from('vip_verifications').insert({
      user_id: user.id,
      bookmaker_identifier: identifier.trim(),
      screenshot_url: screenshotUrl || null,
      status: 'pending',
    }).select().single();

    if (error) {
      console.error('[VIP Submit] DB Error:', error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
    }

    // Alerte Admin
    await notifyAdmin('vip_request', {
      email: user.email,
      identifier: identifier,
      fullName: user.user_metadata?.full_name || 'Utilisateur',
    });

    return NextResponse.json({ success: true, auto_approved: false, data });
  } catch (err) {
    console.error('[VIP Submit] Unexpected error:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
