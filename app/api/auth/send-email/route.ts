/**
 * POST /api/auth/send-email
 *
 * Route unifiée pour tous les emails d'authentification.
 * Bypasse le SMTP Supabase (non configuré) — utilise Resend directement.
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

const FROM = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@algopronos.ai>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';

// ─── Email HTML templates ─────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlgoPronos AI</title>
</head>
<body style="margin:0;padding:0;background:#0f1623;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1623;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#10b981,#6366f1);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:900;font-size:20px;line-height:44px;">A</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:18px;">AlgoPronos AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#1a2332;border:1px solid #2d3a4d;border-radius:20px;overflow:hidden;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;color:#4a5568;font-size:12px;line-height:1.6;">
              © ${new Date().getFullYear()} AlgoPronos AI · 18+ · Jouez responsable<br/>
              <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">${APP_URL.replace('https://', '')}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function verificationEmail(name: string, link: string): string {
  const firstName = name.split(' ')[0] || 'là';
  return baseLayout(`
    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 32px 24px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;line-height:64px;display:block;">✉️</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Confirmez votre email</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#e2e8f0;font-size:15px;line-height:1.6;">
        Bonjour <strong>${firstName}</strong> 👋
      </p>
      <p style="margin:0 0 24px;color:#a0aec0;font-size:14px;line-height:1.7;">
        Bienvenue sur AlgoPronos AI ! Cliquez sur le bouton ci-dessous pour confirmer
        votre adresse email et activer votre compte.
      </p>
      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px 0 24px;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;">
              ✅ Confirmer mon email
            </a>
          </td>
        </tr>
      </table>
      <!-- Features -->
      <div style="background:#0f1623;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Ce qui vous attend</p>
        <p style="margin:4px 0;color:#a0aec0;font-size:13px;">🎯 Ticket IA du Jour · 3 picks sélectionnés par l'algorithme</p>
        <p style="margin:4px 0;color:#a0aec0;font-size:13px;">⚡ 2 coupons combinés par jour · 100% gratuit</p>
        <p style="margin:4px 0;color:#a0aec0;font-size:13px;">📊 Analyse de probabilités en temps réel</p>
      </div>
      <p style="margin:0;color:#4a5568;font-size:12px;line-height:1.6;">
        Ce lien expire dans <strong style="color:#e2e8f0;">24 heures</strong>.
        Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    </div>
  `);
}

function recoveryEmail(email: string, link: string): string {
  return baseLayout(`
    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 32px 24px;text-align:center;">
      <span style="font-size:40px;display:block;margin-bottom:12px;">🔑</span>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Réinitialisation du mot de passe</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#e2e8f0;font-size:15px;line-height:1.6;">
        Une demande de réinitialisation de mot de passe a été effectuée pour <strong>${email}</strong>.
      </p>
      <p style="margin:0 0 24px;color:#a0aec0;font-size:14px;line-height:1.7;">
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant <strong style="color:#e2e8f0;">1 heure</strong>.
      </p>
      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:8px 0 24px;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;">
              🔐 Réinitialiser mon mot de passe
            </a>
          </td>
        </tr>
      </table>
      <div style="background:#0f1623;border:1px solid #2d3a4d;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;color:#f59e0b;font-size:13px;">
          ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
        </p>
      </div>
    </div>
  `);
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

    const resend = new Resend(apiKey);
    const adminSupabase = createAdminClient();

    // ── Génération du lien Supabase Admin ──────────────────────────────────────
    let actionLink: string | undefined;

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

      if (error || !data?.properties?.action_link) {
        // L'utilisateur existe peut-être déjà → essayer magiclink
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

      // Envoi de l'email de vérification
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: '✅ Confirmez votre compte AlgoPronos AI',
        html: verificationEmail(fullName || email.split('@')[0], actionLink),
      });

    } else if (type === 'resend') {
      // Renvoi de l'email de confirmation pour un utilisateur existant non confirmé
      const confirmRedirect = redirectTo || `${APP_URL}/auth/callback?next=/dashboard`;

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: confirmRedirect },
      });

      if (error || !data?.properties?.action_link) {
        return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 });
      }
      actionLink = data.properties.action_link;

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: '🔁 Nouveau lien de connexion AlgoPronos AI',
        html: verificationEmail('', actionLink),
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
      actionLink = data.properties.action_link;

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe AlgoPronos AI',
        html: recoveryEmail(email, actionLink),
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
