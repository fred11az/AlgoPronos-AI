import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

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

  const supabase = await createClient();

  let query = supabase
    .from('vip_verifications')
    .select(`
      *,
      user:profiles(id, email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verifications: data || [] });
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

  const supabase = await createClient();

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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If approved, update user tier to 'verified'
  if (status === 'approved') {
    // Get the user_id from the verification
    const { data: verification } = await supabase
      .from('vip_verifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (verification) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tier: 'verified' })
        .eq('id', verification.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }
  }

  return NextResponse.json({ success: true, message: `Vérification ${status === 'approved' ? 'approuvée' : 'rejetée'}` });
}
