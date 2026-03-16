import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, otp, type } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email et code requis' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Récupérer l'utilisateur par email
    const { data: users } = await adminSupabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // 2. Vérifier l'OTP
    const storedOtp = user.user_metadata?.email_otp;
    const expiry = user.user_metadata?.otp_expiry;

    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    if (expiry && Date.now() > expiry) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 });
    }

    // 3. Succès : MARQUER COMME CONFIRMÉ
    // Si c'est un signup ou resend, on confirme l'email
    if (type !== 'recovery') {
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        user_metadata: { ...user.user_metadata, email_otp: null, otp_expiry: null }
      });

      if (updateError) {
        return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
      }
      
      // On retourne un succès. Le frontend pourra alors logger l'utilisateur ou le rediriger
      return NextResponse.json({ success: true, message: 'Email confirmé' });
    } else {
      // Pour une récupération, on marque qu'il peut changer son pass
      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, email_otp: null, otp_expiry: null, can_reset: true }
      });
      return NextResponse.json({ success: true, message: 'Code valide, redirection vers réinitialisation' });
    }

  } catch (err) {
    console.error('[auth/verify-otp]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
