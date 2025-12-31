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
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const body = await request.json();
  const { id, status, admin_notes } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'ID et status requis' }, { status: 400 });
  }

  // Use admin client to bypass RLS (service role key)
  const supabase = createAdminClient();

  // First get the verification to know the user_id
  const { data: verification, error: fetchError } = await supabase
    .from('vip_verifications')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !verification) {
    console.error('Error fetching verification:', fetchError);
    return NextResponse.json({ error: 'Vérification non trouvée' }, { status: 404 });
  }

  // Update verification status (only required fields first)
  const updateData: Record<string, unknown> = {
    status,
    admin_notes: admin_notes || null,
  };

  // Try to add optional fields if they exist in the table
  try {
    updateData.verified_at = new Date().toISOString();
    updateData.verified_by = user.id;
  } catch {
    // Optional fields, ignore if not supported
  }

  const { data: updatedData, error: updateError } = await supabase
    .from('vip_verifications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating verification:', updateError);

    // If error is about missing columns, try simpler update
    if (updateError.message.includes('column') || updateError.code === '42703') {
      const { error: simpleError } = await supabase
        .from('vip_verifications')
        .update({ status, admin_notes: admin_notes || null })
        .eq('id', id);

      if (simpleError) {
        console.error('Simple update also failed:', simpleError);
        return NextResponse.json({ error: simpleError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  console.log('Verification updated successfully:', updatedData);

  // If approved, try to update user tier to 'verified' (non-blocking)
  let profileUpdated = true;
  if (status === 'approved') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tier: 'verified' })
      .eq('id', verification.user_id);

    if (profileError) {
      console.error('Error updating profile tier:', profileError);
      profileUpdated = false;
      // Don't fail - verification was already updated
    }
  }

  return NextResponse.json({
    success: true,
    profileUpdated,
    message: status === 'approved'
      ? profileUpdated
        ? 'Compte activé avec succès !'
        : 'Vérification approuvée (profil à mettre à jour manuellement)'
      : 'Vérification rejetée'
  });
}
