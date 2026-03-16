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

const FROM    = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@algopronos.com>';
const RAW_URL = process.env.SITE_URL || 'https://www.algopronos.com';
const APP_URL = RAW_URL.includes('vercel.app') ? 'https://www.algopronos.com' : RAW_URL.replace(/\/$/, '');

// Simplified Logo (Text-based for better deliverability)
const LOGO_HTML = `<div style="font-size:24px;font-weight:bold;color:#111827;font-family:Arial,sans-serif;">AlgoPronos <span style="color:#0099FF">AI</span></div>`;

// ─── Template : Email avec code à 6 chiffres (OTP) ───────────────────────────

function otpEmail(name: string, code: string): string {
  const firstName = (name || '').split(' ')[0] || 'Utilisateur';

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">Votre code de vérification</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">
      Merci d'avoir rejoint AlgoPronos AI. Utilisez le code suivant pour confirmer votre adresse email :
    </p>
    
    <div style="text-align:center;margin:32px 0;padding:24px;background-color:#F3F4F6;border-radius:12px;">
      <span style="font-family:monospace;font-size:42px;font-weight:bold;letter-spacing:8px;color:#111827;">${code}</span>
    </div>

    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
      Ce code expirera dans 15 minutes. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
    </p>
  `;

  return baseLayout(body, `Votre code de vérification : ${code}`);
}

// ─── Layout de base ──────────────────────────────────────────────────────────

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AlgoPronos AI</title>
</head>
<body style="margin:0;padding:20px;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;line-height:1.5;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #E5E7EB;border-radius:8px;padding:40px;">
    <div style="margin-bottom:32px;text-align:center;">
      <a href="https://www.algopronos.com" style="text-decoration:none;font-size:24px;font-weight:bold;color:#111827;">
        AlgoPronos <span style="color:#0099FF">AI</span>
      </a>
    </div>
    
    ${content}

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #E5E7EB;text-align:center;font-size:12px;color:#6B7280;">
      <p style="margin:0 0 8px;">© ${new Date().getFullYear()} AlgoPronos AI · Service de notifications transactionnelles</p>
      <p style="margin:0;">
        <a href="https://www.algopronos.com" style="color:#0099FF;text-decoration:none;">algopronos.com</a> · 
        <a href="https://www.algopronos.com/privacy" style="color:#6B7280;text-decoration:none;">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Template : Email de vérification / confirmation ─────────────────────────

function verificationEmail(name: string, link: string): string {
  const firstName = (name || '').split(' ')[0] || 'Utilisateur';

  return `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">Confirmez votre adresse email</h2>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">
      Merci d'avoir rejoint AlgoPronos AI. Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email et terminer votre inscription.
    </p>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${link}" style="display:inline-block;padding:14px 32px;background-color:#0099FF;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        Confirmer mon email
      </a>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
      Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :<br/>
      <span style="word-break:break-all;color:#0099FF;">${link}</span>
    </p>
    <p style="margin:0;font-size:14px;color:#9CA3AF;">
      Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
    </p>
  `;
}

// ─── Template : Réinitialisation du mot de passe ─────────────────────────────

function recoveryEmail(email: string, link: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">Réinitialisation du mot de passe</h2>
    <p style="margin:0 0 16px;font-size:16px;color:#374151;">Bonjour,</p>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;">
      Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>${email}</strong>.
    </p>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${link}" style="display:inline-block;padding:14px 32px;background-color:#111827;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        Réinitialiser le mot de passe
      </a>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#DC2626;font-weight:bold;">
      Important : Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email. Votre mot de passe actuel ne sera pas modifié.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Ce lien expirera dans 1 heure pour des raisons de sécurité.
    </p>
  `;
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

    // 🔥 FORCE PRODUCTION REDIRECTS - Stop Vercel domain leak
    let finalRedirect = `https://www.algopronos.com/auth/callback?next=/dashboard`;
    if (body.redirectTo && body.redirectTo.includes('unlock-vip')) {
      finalRedirect = `https://www.algopronos.com/auth/callback?next=/unlock-vip`;
    }

    const resend        = new Resend(apiKey);
    const adminSupabase = createAdminClient();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    if (type === 'signup') {
      if (!password) return NextResponse.json({ error: 'password requis pour signup' }, { status: 400 });

      const { data: user, error: userError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { 
          full_name: fullName, 
          phone, 
          country,
          email_otp: otp,
          otp_expiry: otpExpiry
        },
        email_confirm: false
      });

      if (userError) {
        if (userError.message.includes('already registered')) {
          const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
          const target = existingUsers?.users.find(u => u.email === email);
          if (target) {
            await adminSupabase.auth.admin.updateUserById(target.id, {
              user_metadata: { ...target.user_metadata, email_otp: otp, otp_expiry: otpExpiry }
            });
          }
        } else {
          return NextResponse.json({ error: userError.message }, { status: 500 });
        }
      }

      const displayName = fullName || email.split('@')[0];
      const result = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${otp} est votre code AlgoPronos AI`,
        replyTo: 'support@algopronos.com',
        html: otpEmail(displayName, otp),
        text: `Bonjour ${displayName},\n\nVotre code de vérification AlgoPronos AI est : ${otp}\n\nCe code expire dans 15 minutes.\n\n© ${new Date().getFullYear()} AlgoPronos AI`,
      });

      if (result.error) {
        return NextResponse.json({ error: 'Échec de l\'envoi de l\'email', details: result.error }, { status: 500 });
      }

      await notifyAdmin('signup', { email, fullName, phone, country }, 'pending');

    } else if (type === 'resend') {
      const { data: users } = await adminSupabase.auth.admin.listUsers();
      const target = users?.users.find(u => u.email === email);
      
      if (!target) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

      await adminSupabase.auth.admin.updateUserById(target.id, {
        user_metadata: { ...target.user_metadata, email_otp: otp, otp_expiry: otpExpiry }
      });

      const result = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${otp} est votre code AlgoPronos AI`,
        replyTo: 'support@algopronos.com',
        html: otpEmail(target.user_metadata?.full_name || '', otp),
        text: `Bonjour,\n\nVotre code de vérification AlgoPronos AI est : ${otp}\n\nCe code expire dans 15 minutes.\n\n© ${new Date().getFullYear()} AlgoPronos AI`,
      });

      if (result.error) return NextResponse.json({ error: 'Échec de l\'envoi' }, { status: 500 });

    } else if (type === 'recovery') {
      const { data: users } = await adminSupabase.auth.admin.listUsers();
      const target = users?.users.find(u => u.email === email);
      
      if (!target) return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });

      await adminSupabase.auth.admin.updateUserById(target.id, {
        user_metadata: { ...target.user_metadata, email_otp: otp, otp_expiry: otpExpiry, is_recovery: true }
      });

      const result = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${otp} est votre code de récupération`,
        replyTo: 'support@algopronos.com',
        html: otpEmail(target.user_metadata?.full_name || '', otp),
        text: `Bonjour,\n\nUtilisez ce code pour réinitialiser votre mot de passe : ${otp}\n\nCe code expire dans 15 minutes.\n\n© ${new Date().getFullYear()} AlgoPronos AI`,
      });

      if (result.error) return NextResponse.json({ error: 'Échec de l\'envoi' }, { status: 500 });

    } else {
      return NextResponse.json({ error: 'type invalide' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[auth/send-email]', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
