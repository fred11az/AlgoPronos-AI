import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Récupérer l'utilisateur
    const { data: users } = await adminSupabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // 2. Vérifier si le code OTP a bien été validé (flag can_reset)
    if (!user.user_metadata?.can_reset) {
      return NextResponse.json({ error: 'Action non autorisée. Veuillez valider le code OTP.' }, { status: 403 });
    }

    // 3. Mettre à jour le mot de passe
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      password: password,
      user_metadata: { ...user.user_metadata, can_reset: null } // On reset le flag
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Mot de passe mis à jour' });

  } catch (err) {
    console.error('[auth/reset-password]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
