/**
 * POST /api/auth/send-email
 *
 * Route unifiée pour tous les emails d'authentification.
 * Bypasse le SMTP Supabase — utilise Resend directement.
 *
 * Body:
 *   type: 'signup' | 'resend' | 'recovery'
 *   email: string
 *   password?: string   (requis pour type='signup')
 *   fullName?: string
 *   phone?: string
 *   country?: string
 *   redirectTo?: string
 */

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyAdmin } from '@/lib/services/notification-service';

const FROM    = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@mail.algopronos.com>';
const RAW_URL = process.env.SITE_URL || 'https://algopronos.com';
const APP_URL = RAW_URL.replace(/\/$/, '');

// Simplified Logo (Text-based for better deliverability)
const LOGO_HTML = `<div style="font-size:24px;font-weight:bold;color:#FFFFFF;font-family:Arial,sans-serif;">AlgoPronos <span style="color:#00D4FF">AI</span></div>`;

// ─── Layout de base ──────────────────────────────────────────────────────────

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>AlgoPronos AI</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d1520;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

<!-- Preheader invisible -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0d1520;">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1520;">
  <tr>
    <td align="center" style="padding:32px 16px 48px;">

      <!-- Container -->
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" border="0">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${APP_URL}" style="display:inline-block;text-decoration:none;">
              ${LOGO_HTML}
            </a>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#162032;border:1px solid #1e3a5f;border-radius:16px;overflow:hidden;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:28px;text-align:center;">
            <p style="margin:0 0 6px;color:#3d5a7a;font-size:12px;line-height:1.6;">
              © ${new Date().getFullYear()} AlgoPronos AI · Plateforme d'analyse sportive
            </p>
            <p style="margin:0;font-size:12px;">
              <a href="${APP_URL}" style="color:#00D4FF;text-decoration:none;">algopronos.com</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/support" style="color:#3d5a7a;text-decoration:none;">Support</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/privacy" style="color:#3d5a7a;text-decoration:none;">Confidentialité</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Template : Email de vérification / confirmation ─────────────────────────

function verificationEmail(name: string, link: string): string {
  const firstName = (name || '').split(' ')[0] || 'là';

  const body = `
    <!-- Header accent bar -->
    <div style="height:4px;background:linear-gradient(90deg,#00D4FF,#0099FF);"></div>

    <!-- Header icon -->
    <div style="padding:36px 40px 0;text-align:center;">
      <div style="display:inline-block;background-color:#0d1c2e;border:1px solid #00D4FF30;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:32px;">
        ✉️
      </div>
      <h1 style="margin:20px 0 8px;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
        Confirmez votre email
      </h1>
      <p style="margin:0;color:#6b8cad;font-size:15px;line-height:1.6;">
        Plus qu'une étape pour activer votre accès
      </p>
    </div>

    <!-- Body -->
    <div style="padding:28px 40px;">

      <p style="margin:0 0 20px;color:#c8ddf0;font-size:15px;line-height:1.7;">
        Bonjour <strong style="color:#FFFFFF;">${firstName}</strong> 👋
      </p>
      <p style="margin:0 0 28px;color:#8aabcc;font-size:14px;line-height:1.7;">
        Bienvenue sur <strong style="color:#00D4FF;">AlgoPronos AI</strong> ! Cliquez sur le bouton
        ci-dessous pour confirmer votre adresse email et activer votre compte.
      </p>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="15%" fillcolor="#00D4FF"><w:anchorlock/><center style="color:#000000;font-family:Arial;font-size:15px;font-weight:bold;">✅ Confirmer mon email</center></v:roundrect><![endif]-->
            <!--[if !mso]><!-->
            <a href="${link}"
               style="display:inline-block;background-color:#00D4FF;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:15px 48px;border-radius:10px;letter-spacing:0.2px;">
              ✅&nbsp;&nbsp;Confirmer mon email
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Features box -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1520;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 12px;color:#00D4FF;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Ce qui vous attend</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;color:#8aabcc;font-size:13px;line-height:1.5;">🎯&nbsp;&nbsp;<strong style="color:#c8ddf0;">Analyses IA quotidiennes</strong> · Matchs sélectionnés par l'algorithme</td></tr>
              <tr><td style="padding:4px 0;color:#8aabcc;font-size:13px;line-height:1.5;">📊&nbsp;&nbsp;<strong style="color:#c8ddf0;">Statistiques en temps réel</strong> · Probabilités & données optimisées</td></tr>
              <tr><td style="padding:4px 0;color:#8aabcc;font-size:13px;line-height:1.5;">🏆&nbsp;&nbsp;<strong style="color:#c8ddf0;">Classement des membres</strong> · Suivez votre progression</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Security note -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1e3a5f;">
        <tr>
          <td style="padding-top:20px;">
            <p style="margin:0;color:#3d5a7a;font-size:12px;line-height:1.7;">
              🔒 Ce lien expire dans <strong style="color:#6b8cad;">24 heures</strong>.
              Si vous n'avez pas créé ce compte, ignorez cet email — rien ne changera.
            </p>
          </td>
        </tr>
      </table>

    </div>
  `;

  return baseLayout(body, `Confirmez votre email pour activer votre compte AlgoPronos AI`);
}

// ─── Template : Réinitialisation du mot de passe ─────────────────────────────

function recoveryEmail(email: string, link: string): string {
  const body = `
    <!-- Header accent bar -->
    <div style="height:4px;background:linear-gradient(90deg,#6366f1,#00D4FF);"></div>

    <!-- Header icon -->
    <div style="padding:36px 40px 0;text-align:center;">
      <div style="display:inline-block;background-color:#0d1c2e;border:1px solid #6366f130;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:32px;">
        🔑
      </div>
      <h1 style="margin:20px 0 8px;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.3px;">
        Réinitialisation du mot de passe
      </h1>
      <p style="margin:0;color:#6b8cad;font-size:15px;line-height:1.6;">
        Créez un nouveau mot de passe sécurisé
      </p>
    </div>

    <!-- Body -->
    <div style="padding:28px 40px;">

      <p style="margin:0 0 20px;color:#8aabcc;font-size:14px;line-height:1.7;">
        Une demande de réinitialisation a été effectuée pour le compte associé à
        <strong style="color:#00D4FF;">${email}</strong>.
      </p>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="15%" fillcolor="#6366f1"><w:anchorlock/><center style="color:#ffffff;font-family:Arial;font-size:15px;font-weight:bold;">🔐 Réinitialiser mon mot de passe</center></v:roundrect><![endif]-->
            <!--[if !mso]><!-->
            <a href="${link}"
               style="display:inline-block;background-color:#6366f1;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:10px;letter-spacing:0.2px;">
              🔐&nbsp;&nbsp;Réinitialiser mon mot de passe
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Warning box -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1200;border:1px solid #f59e0b40;border-radius:12px;margin-bottom:24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#f59e0b;font-size:13px;line-height:1.6;">
              ⚠️&nbsp;&nbsp;<strong>Vous n'avez pas fait cette demande ?</strong><br/>
              <span style="color:#8aabcc;">Ignorez cet email. Votre mot de passe actuel restera inchangé. Ce lien expire dans <strong style="color:#c8ddf0;">1 heure</strong>.</span>
            </p>
          </td>
        </tr>
      </table>

      <!-- Security note -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1e3a5f;">
        <tr>
          <td style="padding-top:20px;">
            <p style="margin:0;color:#3d5a7a;font-size:12px;line-height:1.7;">
              🔒 AlgoPronos AI ne vous demandera jamais votre mot de passe par email.
              Si quelqu'un vous le demande, signalez-le sur <a href="${APP_URL}/support" style="color:#00D4FF;text-decoration:none;">notre support</a>.
            </p>
          </td>
        </tr>
      </table>

    </div>
  `;

  return baseLayout(body, `Réinitialisez votre mot de passe AlgoPronos AI`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, password, fullName = '', phone = '', country = 'BJ', redirectTo } = body;

    if (!email || !type) {
      return NextResponse.json({ error: 'email et type requis' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY non configuré' }, { status: 500 });
    }

    const resend        = new Resend(apiKey);
    const adminSupabase = createAdminClient();

    if (type === 'signup') {
      if (!password) return NextResponse.json({ error: 'password requis pour signup' }, { status: 400 });

      const confirmRedirect = redirectTo || `${APP_URL}/auth/callback?next=/dashboard`;

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          redirectTo: confirmRedirect,
          data: { full_name: fullName, phone, country },
        },
      });

      let actionLink: string;

      if (error || !data?.properties?.action_link) {
        // Utilisateur déjà existant → magic link
        const ml = await adminSupabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: confirmRedirect },
        });
        if (ml.error || !ml.data?.properties?.action_link) {
          return NextResponse.json({ error: 'Impossible de générer le lien de confirmation' }, { status: 500 });
        }
        actionLink = ml.data.properties.action_link;
      } else {
        actionLink = data.properties.action_link;
      }

      const displayName = fullName || email.split('@')[0];
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Confirmez votre compte AlgoPronos AI',
        replyTo: 'support@algopronos.com',
        headers: { 'List-Unsubscribe': `<mailto:unsubscribe@algopronos.com?subject=unsubscribe>` },
        html: verificationEmail(displayName, actionLink),
        text: `Bonjour ${displayName},\n\nConfirmez votre email AlgoPronos AI en cliquant sur ce lien :\n${actionLink}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas créé ce compte, ignorez cet email.\n\n© ${new Date().getFullYear()} AlgoPronos AI · algopronos.com`,
      });

      // 🔥 Alerte Admin : Nouvelle inscription
      await notifyAdmin('signup', { email, fullName, phone, country });

    } else if (type === 'resend') {
      const confirmRedirect = redirectTo || `${APP_URL}/auth/callback?next=/dashboard`;

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: confirmRedirect },
      });

      if (error || !data?.properties?.action_link) {
        return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 });
      }

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Votre lien de connexion AlgoPronos AI',
        replyTo: 'support@algopronos.com',
        headers: { 'List-Unsubscribe': `<mailto:unsubscribe@algopronos.com?subject=unsubscribe>` },
        html: verificationEmail('', data.properties.action_link),
        text: `Bonjour,\n\nConnectez-vous à AlgoPronos AI avec ce lien :\n${data.properties.action_link}\n\nCe lien expire dans 24 heures.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.\n\n© ${new Date().getFullYear()} AlgoPronos AI · algopronos.com`,
      });

    } else if (type === 'recovery') {
      const resetRedirect = redirectTo || `${APP_URL}/auth/callback?next=/reset-password`;

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: resetRedirect },
      });

      if (error || !data?.properties?.action_link) {
        return NextResponse.json({ error: 'Impossible de générer le lien de récupération' }, { status: 500 });
      }

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Réinitialisation de votre mot de passe AlgoPronos AI',
        replyTo: 'support@algopronos.com',
        headers: { 'List-Unsubscribe': `<mailto:unsubscribe@algopronos.com?subject=unsubscribe>` },
        html: recoveryEmail(email, data.properties.action_link),
        text: `Bonjour,\n\nUne demande de réinitialisation a été effectuée pour le compte ${email}.\n\nCliquez sur ce lien pour créer un nouveau mot de passe :\n${data.properties.action_link}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe restera inchangé.\n\n© ${new Date().getFullYear()} AlgoPronos AI · algopronos.com`,
      });

    } else {
      return NextResponse.json({ error: 'type invalide' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[auth/send-email]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
