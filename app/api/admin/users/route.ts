import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { notifyRevocation } from '@/lib/services/notification-service';

// GET - List all users with their VIP verification status
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, tier, created_at, country')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch latest approved verification for each VIP user
  const vipUserIds = (profiles || [])
    .filter(p => p.tier === 'verified')
    .map(p => p.id);

  let verificationsMap: Record<string, { id: string; bookmaker_identifier: string; verified_at: string | null }> = {};

  if (vipUserIds.length > 0) {
    const { data: verifs } = await supabase
      .from('vip_verifications')
      .select('id, user_id, bookmaker_identifier, verified_at')
      .in('user_id', vipUserIds)
      .eq('status', 'approved')
      .order('verified_at', { ascending: false });

    if (verifs) {
      // Keep only the latest per user
      for (const v of verifs) {
        if (!verificationsMap[v.user_id]) {
          verificationsMap[v.user_id] = {
            id: v.id,
            bookmaker_identifier: v.bookmaker_identifier,
            verified_at: v.verified_at,
          };
        }
      }
    }
  }

  const result = (profiles || []).map(p => ({
    ...p,
    verification: verificationsMap[p.id] || null,
  }));

  return NextResponse.json({ users: result });
}

// PATCH - Revoke VIP access for a user
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    const { user_id, reason } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Reset the user's tier
    const { error: tierError } = await supabase
      .from('profiles')
      .update({
        tier: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (tierError) {
      return NextResponse.json({ error: `Erreur lors de la révocation: ${tierError.message}` }, { status: 500 });
    }

    // 2. Reject all approved verifications for this user
    await supabase
      .from('vip_verifications')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Accès révoqué par l\'administrateur',
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('user_id', user_id)
      .eq('status', 'approved');

    // 3. Fetch user profile to send notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('id', user_id)
      .single();

    let notifResult = { email: false, whatsapp: false };
    if (profile?.email) {
      notifResult = await notifyRevocation({
        userEmail: profile.email,
        userName: profile.full_name || undefined,
        reason: reason || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Accès VIP révoqué avec succès',
      notification: notifResult,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users:', error);
    return NextResponse.json({
      error: 'Une erreur inattendue est survenue',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
