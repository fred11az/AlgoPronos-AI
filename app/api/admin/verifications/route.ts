import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

// GET - Fetch all verifications (admin only)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'pending';

  // Use admin client to bypass RLS (service role key)
  const supabase = createAdminClient();

  // Fetch verifications first
  let query = supabase
    .from('vip_verifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: verifications, error } = await query;

  if (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user profiles separately to avoid relationship ambiguity
  const userIds = Array.from(new Set((verifications || []).map(v => v.user_id)));

  let profiles: Record<string, { id: string; email: string; full_name: string }> = {};

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profilesData) {
      profiles = profilesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; email: string; full_name: string }>);
    }
  }

  // Combine data
  const result = (verifications || []).map(v => ({
    ...v,
    user: profiles[v.user_id] || null,
  }));

  return NextResponse.json({ verifications: result });
}

// PATCH - Update verification status (approve/reject)
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

    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID et status requis' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Status invalide. Utilisez: approved, rejected, ou pending' }, { status: 400 });
    }

    // Use admin client to bypass RLS (service role key)
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (error) {
      console.error('Failed to create admin client:', error);
      return NextResponse.json({
        error: 'Configuration serveur incorrecte. Vérifiez SUPABASE_SERVICE_ROLE_KEY.'
      }, { status: 500 });
    }

    // First get the verification to know the user_id
    const { data: verification, error: fetchError } = await supabase
      .from('vip_verifications')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching verification:', fetchError);
      return NextResponse.json({
        error: `Erreur lors de la récupération: ${fetchError.message}`,
        details: fetchError.code
      }, { status: 500 });
    }

    if (!verification) {
      return NextResponse.json({ error: 'Vérification non trouvée' }, { status: 404 });
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('vip_verifications')
      .update({
        status,
        admin_notes: admin_notes || null,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json({
        error: `Erreur lors de la mise à jour: ${updateError.message}`,
        details: updateError.code
      }, { status: 500 });
    }

    // If approved, try to update user tier to 'verified'
    let profileUpdated = true;
    let profileError: string | null = null;

    if (status === 'approved') {
      const { error: tierError } = await supabase
        .from('profiles')
        .update({
          tier: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.user_id);

      if (tierError) {
        console.error('Error updating profile tier:', tierError);
        profileUpdated = false;
        profileError = tierError.message;
        // Don't fail - verification was already updated
      }
    }

    return NextResponse.json({
      success: true,
      profileUpdated,
      profileError,
      message: status === 'approved'
        ? profileUpdated
          ? 'Compte activé avec succès !'
          : `Vérification approuvée mais erreur profil: ${profileError}`
        : 'Vérification rejetée'
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/verifications:', error);
    return NextResponse.json({
      error: 'Une erreur inattendue est survenue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
