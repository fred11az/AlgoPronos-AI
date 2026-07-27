import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Désabonnement marketing.
 *
 * POST — appelé automatiquement par Gmail/Yahoo (désabonnement en un clic,
 *        en-tête List-Unsubscribe-Post). Doit répondre 200 sans confirmation
 *        humaine, sinon les fournisseurs considèrent le lien comme cassé.
 * GET  — lien cliqué manuellement dans le pied de page : même effet, mais
 *        renvoie une page de confirmation lisible.
 *
 * Ne coupe QUE le marketing. Les emails transactionnels (code de vérification,
 * activation de compte, statut d'un dépôt) continuent d'être envoyés : ils sont
 * nécessaires au fonctionnement du compte.
 */

async function optOut(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return false;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Profil existant → on marque l'opt-out sur le compte.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', clean)
    .maybeSingle();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ marketing_opt_out: true, marketing_opt_out_at: now })
      .eq('id', profile.id);
  }

  // Liste de suppression globale (couvre aussi les adresses sans compte).
  await supabase
    .from('email_opt_outs')
    .upsert({ email: clean, source: 'list-unsubscribe' }, { onConflict: 'email' });

  return true;
}

export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email requis' }, { status: 400 });
  }

  try {
    await optOut(email);
  } catch (err) {
    // On répond 200 malgré l'erreur : un échec ferait réessayer le fournisseur
    // et dégraderait la réputation. L'erreur est loggée pour rattrapage.
    console.error('[unsubscribe] Échec opt-out:', err);
  }

  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return new NextResponse(page('Lien invalide', "L'adresse email est manquante dans le lien."), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let success = false;
  try {
    success = await optOut(email);
  } catch (err) {
    console.error('[unsubscribe] Échec opt-out:', err);
  }

  const html = success
    ? page(
        'Désinscription confirmée',
        `L'adresse <strong>${escapeHtml(email)}</strong> ne recevra plus nos emails d'actualités et d'offres.<br/><br/>
         Vous continuerez à recevoir les emails liés à votre compte (code de vérification, activation d'accès, statut de vos opérations), car ils sont nécessaires à son fonctionnement.`
      )
    : page('Désinscription impossible', "Cette adresse email n'a pas pu être traitée. Écrivez-nous à support@algopronos.com.");

  return new NextResponse(html, {
    status: success ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex"/>
  <title>${title} — AlgoPronos AI</title>
</head>
<body style="margin:0;padding:40px 20px;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:520px;margin:0 auto;border:1px solid #E5E7EB;border-radius:8px;padding:40px;text-align:center;">
    <p style="font-size:24px;font-weight:bold;margin:0 0 32px;">AlgoPronos <span style="color:#0099FF">AI</span></p>
    <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 32px;">${message}</p>
    <a href="https://www.algopronos.com" style="display:inline-block;padding:12px 28px;background:#0099FF;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
      Retour sur AlgoPronos
    </a>
  </div>
</body>
</html>`;
}
