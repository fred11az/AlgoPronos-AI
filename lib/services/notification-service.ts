/**
 * Notification Service — Email (Resend) + WhatsApp (Meta Cloud API)
 *
 * Les envois passent tous par lib/services/email/client.ts, qui sépare le flux
 * transactionnel du flux marketing (cf. docs/EMAIL-DELIVERABILITY.md).
 *
 * Env vars required:
 *   RESEND_API_KEY            — https://resend.com
 *   RESEND_TRANSACTIONAL_FROM — ex: "AlgoPronos AI <no-reply@algopronos.com>"
 *   RESEND_MARKETING_FROM     — ex: "AlgoPronos AI <news@mail.algopronos.com>"
 *   WHATSAPP_TOKEN            — Meta WhatsApp Cloud API bearer token
 *   WHATSAPP_PHONE_NUMBER_ID  — Phone Number ID (pas le numéro affiché)
 *   WHATSAPP_TEMPLATE_TICKET  — nom du template Meta approuvé (ex: "ticket_result")
 */

import { sendTransactional, sendMarketing, sendInternal } from '@/lib/services/email/client';
import {
  transactionalLayout,
  transactionalButton,
  transactionalHeading,
  transactionalParagraph,
  transactionalInfoBox,
} from '@/lib/services/email/layout';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TicketMatch {
  home_team: string;
  away_team: string;
  prediction: string;
  odds: number;
}

export interface TicketNotificationPayload {
  userEmail: string;
  userName?: string;
  userPhone?: string;   // Format international ex: +22996123456
  date: string;         // YYYY-MM-DD
  status: 'won' | 'lost' | 'void';
  totalOdds: number;
  matches: TicketMatch[];
  resultNotes?: string;
}

// ─── Email ─────────────────────────────────────────────────────────────────

function buildTicketEmailHtml(p: TicketNotificationPayload): string {
  const statusLabel  = p.status === 'won' ? '✅ GAGNÉ' : p.status === 'lost' ? '❌ PERDU' : '⚪ ANNULÉ';
  const statusColor  = p.status === 'won' ? '#22c55e' : p.status === 'lost' ? '#ef4444' : '#6b7280';
  const greeting     = p.userName ? `Bonjour ${p.userName},` : 'Bonjour,';
  const dateLabel    = new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const matchRows = p.matches.map(m => `
    <tr>
      <td style="padding:8px 12px;color:#e2e8f0;font-size:14px">${m.home_team} vs ${m.away_team}</td>
      <td style="padding:8px 12px;color:#a0aec0;font-size:13px">${m.prediction}</td>
      <td style="padding:8px 12px;color:#7c3aed;font-size:13px;font-weight:600;text-align:right">${m.odds.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700">Résultat du ticket IA</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${dateLabel}</p>
    </div>

    <!-- Status Badge -->
    <div style="padding:28px 32px 16px">
      <p style="margin:0 0 20px;color:#a0aec0;font-size:15px">${greeting}</p>
      <div style="display:inline-block;background:${statusColor}22;border:1px solid ${statusColor}44;border-radius:12px;padding:14px 24px">
        <p style="margin:0;font-size:28px;font-weight:800;color:${statusColor};letter-spacing:1px">${statusLabel}</p>
        <p style="margin:4px 0 0;color:#a0aec0;font-size:13px">Cote totale : <strong style="color:#e2e8f0">${p.totalOdds.toFixed(2)}</strong></p>
      </div>
    </div>

    <!-- Matches -->
    <div style="padding:0 32px 24px">
      <p style="margin:0 0 12px;color:#7c3aed;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Sélections</p>
      <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:10px;overflow:hidden">
        ${matchRows}
      </table>
    </div>

    ${p.resultNotes ? `
    <div style="padding:0 32px 24px">
      <p style="margin:0;color:#6b7280;font-size:13px;background:#0f0f1a;border-radius:8px;padding:12px 16px;border-left:3px solid #7c3aed">${p.resultNotes}</p>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai'}/dashboard/history"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px">
        Voir l'historique complet
      </a>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
        Générez votre prochain ticket sur <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai'}" style="color:#7c3aed">AlgoPronos AI</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">
        AlgoPronos AI — Intelligence Artificielle.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendTicketResultEmail(p: TicketNotificationPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Notification] RESEND_API_KEY not set — email skipped');
    return false;
  }

  const statusLabel = p.status === 'won' ? 'Ticket gagné' : p.status === 'lost' ? 'Ticket perdu' : 'Ticket annulé';
  const dateFr = new Date(p.date).toLocaleDateString('fr-FR');

  // Flux transactionnel : c'est le résultat du ticket de CET utilisateur, pas
  // une campagne. Objet sans emoji ni pipe (marqueurs promotionnels courants).
  const { ok } = await sendTransactional({
    to: p.userEmail,
    subject: `${statusLabel} — votre ticket du ${dateFr}`,
    html: buildTicketEmailHtml(p),
    text: `${statusLabel} pour votre ticket du ${dateFr}.\nCote totale : ${p.totalOdds.toFixed(2)}\n\nConsultez vos sélections sur : ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com'}/dashboard/history`,
  });
  return ok;
}

// ─── WhatsApp ──────────────────────────────────────────────────────────────

/**
 * Envoie une notification WhatsApp via Meta Cloud API.
 *
 * Setup requis :
 * 1. Créer un app Meta Business (https://developers.facebook.com)
 * 2. Activer "WhatsApp Business API"
 * 3. Créer + soumettre le template "ticket_result" (ou autre nom)
 *    Exemple de template :
 *      "Bonjour {{1}} ! Votre ticket IA du {{2}} est {{3}} (cote {{4}}).
 *       Consultez votre historique sur AlgoPronos AI."
 * 4. Définir WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_TICKET
 */
export async function sendTicketResultWhatsApp(p: TicketNotificationPayload): Promise<boolean> {
  const token      = process.env.WHATSAPP_TOKEN;
  const phoneId    = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_TICKET || 'ticket_result';

  if (!token || !phoneId) {
    console.warn('[Notification] WhatsApp env vars not set — WA skipped');
    return false;
  }

  if (!p.userPhone) {
    return false;
  }

  // Nettoyer le numéro (garder uniquement les chiffres + éventuel +)
  const phone = p.userPhone.replace(/\s/g, '').replace(/^00/, '+');

  const statusLabel = p.status === 'won' ? 'GAGNÉ 🎉' : p.status === 'lost' ? 'PERDU 😔' : 'ANNULÉ ⚪';
  const dateLabel   = new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: p.userName || 'Parieur' },
            { type: 'text', text: dateLabel },
            { type: 'text', text: statusLabel },
            { type: 'text', text: p.totalOdds.toFixed(2) },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('[Notification] WhatsApp API error:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Notification] WhatsApp send failed:', err);
    return false;
  }
}

// ─── Combined sender ───────────────────────────────────────────────────────

export async function notifyTicketResult(p: TicketNotificationPayload) {
  const [emailOk, waOk] = await Promise.all([
    sendTicketResultEmail(p),
    sendTicketResultWhatsApp(p),
  ]);

  return { email: emailOk, whatsapp: waOk };
}

// ─── Activation / Rejection notifications ──────────────────────────────────

export interface ActivationPayload {
  userEmail: string;
  userName?: string;
  userPhone?: string;
}

function buildActivationEmailHtml(p: ActivationPayload): string {
  const firstName = p.userName?.split(' ')[0] || 'Parieur';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

  const features = [
    'Analyses IA illimitées (sans quota journalier)',
    'Probabilités du modèle et value bets visibles',
    'Bankroll IA personnalisée sur chaque ticket',
    'Bouclier 20 Matchs — remboursement si 1 erreur sur 20',
    'Garantie Matchs Nuls — 100% si 2 nuls perdants',
    'Accès aux cotes prioritaires négociées',
  ].map(f => `<li style="margin:0 0 8px;">${f}</li>`).join('');

  const content = `
    ${transactionalHeading('Votre accès Full Access est activé')}
    ${transactionalParagraph(`Bonjour ${firstName},`)}
    ${transactionalParagraph('Votre compte bookmaker a été vérifié et validé par notre équipe. Votre accès Full Access est désormais actif sur votre compte AlgoPronos AI.')}
    ${transactionalInfoBox(`
      <p style="margin:0 0 12px;font-weight:bold;color:#111827;">Ce que votre compte débloque</p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;">${features}</ul>
    `)}
    ${transactionalButton('Accéder à mon tableau de bord', `${appUrl}/dashboard`)}
    <p style="margin:0;font-size:14px;color:#6B7280;">
      Une question sur votre accès ? Répondez directement à cet email.
    </p>
  `;

  return transactionalLayout(content, 'Votre accès Full Access AlgoPronos AI est activé');
}

/** Étapes de (re)configuration, partagées par les emails de refus et de suspension. */
function accessStepsHtml(): string {
  return transactionalInfoBox(`
    <p style="margin:0 0 12px;font-weight:bold;color:#111827;">Comment obtenir votre accès</p>
    <p style="margin:0 0 4px;font-weight:bold;">1. Configurez votre compte depuis notre plateforme</p>
    <p style="margin:0 0 12px;color:#6B7280;font-size:14px;">La configuration doit être faite depuis AlgoPronos : c'est cette étape qui permet à notre algorithme d'activer l'optimisation IA sur votre compte. Les comptes existants ne sont souvent pas reconnus.</p>
    <p style="margin:0 0 12px;font-weight:bold;">2. Créez un nouveau compte de jeu après la synchronisation.</p>
    <p style="margin:0;font-weight:bold;">3. Soumettez votre nouvel identifiant bookmaker dans votre compte AlgoPronos pour validation.</p>
  `);
}

function buildRejectionEmailHtml(p: ActivationPayload & { reason?: string }): string {
  const firstName = p.userName?.split(' ')[0] || 'Parieur';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

  const reasonBlock = p.reason
    ? transactionalInfoBox(`<p style="margin:0 0 4px;font-weight:bold;color:#111827;">Motif</p><p style="margin:0;">${p.reason}</p>`)
    : '';

  const content = `
    ${transactionalHeading("Votre demande d'accès n'a pas pu être validée")}
    ${transactionalParagraph(`Bonjour ${firstName},`)}
    ${transactionalParagraph("Après vérification, votre demande d'accès Full Access n'a pas pu être validée par notre équipe.")}
    ${reasonBlock}
    ${accessStepsHtml()}
    ${transactionalButton('Configurer mon Compte Optimisé IA', `${appUrl}/compte-optimise-ia`)}
    <p style="margin:0;font-size:14px;color:#6B7280;">
      Des questions ? Répondez directement à cet email, notre équipe vous répond.
    </p>
  `;

  return transactionalLayout(content, "Votre demande d'accès Full Access AlgoPronos AI");
}

function buildRevocationEmailHtml(p: ActivationPayload & { reason?: string }): string {
  const firstName = p.userName?.split(' ')[0] || 'Parieur';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

  const reasonBlock = p.reason
    ? transactionalInfoBox(`<p style="margin:0 0 4px;font-weight:bold;color:#111827;">Motif</p><p style="margin:0;">${p.reason}</p>`)
    : '';

  const content = `
    ${transactionalHeading('Votre accès Full Access a été suspendu')}
    ${transactionalParagraph(`Bonjour ${firstName},`)}
    ${transactionalParagraph('Votre accès Full Access AlgoPronos AI a été suspendu par notre équipe.')}
    ${reasonBlock}
    ${accessStepsHtml()}
    ${transactionalButton('Réactiver mon accès', `${appUrl}/compte-optimise-ia`)}
    <p style="margin:0;font-size:14px;color:#6B7280;">
      Des questions ? Répondez directement à cet email, notre équipe vous répond.
    </p>
  `;

  return transactionalLayout(content, 'Information concernant votre accès AlgoPronos AI');
}

export async function sendActivationEmail(p: ActivationPayload): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';
  const { ok } = await sendTransactional({
    to: p.userEmail,
    subject: 'Votre accès Full Access AlgoPronos AI est activé',
    html: buildActivationEmailHtml(p),
    text: `Bonjour ${p.userName || 'Parieur'},\n\nVotre compte bookmaker a été vérifié et validé. Votre accès Full Access AlgoPronos AI est désormais actif.\n\nAccédez à votre tableau de bord : ${appUrl}/dashboard`,
  });
  return ok;
}

export async function sendRejectionEmail(p: ActivationPayload & { reason?: string }): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';
  const { ok } = await sendTransactional({
    to: p.userEmail,
    subject: "Votre demande d'accès Full Access AlgoPronos AI",
    html: buildRejectionEmailHtml(p),
    text: `Bonjour ${p.userName || 'Parieur'},\n\nVotre demande d'accès Full Access AlgoPronos AI n'a pas pu être validée.${p.reason ? `\n\nMotif : ${p.reason}` : ''}\n\nConfigurez votre compte depuis notre plateforme pour obtenir l'accès : ${appUrl}/compte-optimise-ia`,
  });
  return ok;
}

export async function sendActivationWhatsApp(p: { userPhone: string; userName?: string }): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_ACTIVATION || 'account_activated';
  if (!token || !phoneId || !p.userPhone) return false;

  const phone = p.userPhone.replace(/\s/g, '').replace(/^00/, '+');
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'fr' },
          components: [{
            type: 'body',
            parameters: [{ type: 'text', text: p.userName || 'Parieur' }],
          }],
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Notification] Activation WhatsApp failed:', err);
    return false;
  }
}

export async function notifyActivation(p: ActivationPayload) {
  const [emailOk, waOk] = await Promise.all([
    sendActivationEmail(p),
    p.userPhone ? sendActivationWhatsApp({ userPhone: p.userPhone, userName: p.userName }) : Promise.resolve(false),
  ]);
  return { email: emailOk, whatsapp: waOk };
}

export async function notifyRejection(p: ActivationPayload & { reason?: string }) {
  const emailOk = await sendRejectionEmail(p);
  return { email: emailOk, whatsapp: false };
}

export async function sendRevocationEmail(p: ActivationPayload & { reason?: string }): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';
  const { ok } = await sendTransactional({
    to: p.userEmail,
    subject: 'Information importante concernant votre accès AlgoPronos AI',
    html: buildRevocationEmailHtml(p),
    text: `Bonjour ${p.userName || 'Parieur'},\n\nVotre accès Full Access AlgoPronos AI a été suspendu par notre équipe.${p.reason ? `\n\nMotif : ${p.reason}` : ''}\n\nConfigurez votre compte depuis notre plateforme pour réactiver l'accès : ${appUrl}/compte-optimise-ia`,
  });
  return ok;
}

export async function notifyRevocation(p: ActivationPayload & { reason?: string }) {
  const emailOk = await sendRevocationEmail(p);
  return { email: emailOk, whatsapp: false };
}

function buildUpgradeInvitationEmailHtml(p: ActivationPayload): string {
  const firstName = p.userName?.split(' ')[0] || 'Parieur';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700">Debloquez le Full Access gratuitement</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#a0aec0;font-size:15px">Bonjour <strong style="color:#fff">${firstName}</strong>,</p>
      <p style="margin:0 0 20px;color:#a0aec0;font-size:14px;line-height:1.6">
        Vous utilisez AlgoPronos AI en acces de base. En configurant un compte bookmaker optimise IA,
        vous debloquez l'ensemble des fonctionnalites <strong style="color:#fff">gratuitement</strong>.
      </p>

      <div style="background:#0f0f1a;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Ce que vous debloquez</p>
        <p style="margin:0 0 8px;color:#e2e8f0;font-size:13px">Analyses IA illimitees — sans quota journalier</p>
        <p style="margin:0 0 8px;color:#e2e8f0;font-size:13px">Probabilites du modele et value bets visibles</p>
        <p style="margin:0 0 8px;color:#e2e8f0;font-size:13px">Bankroll IA personnalise sur chaque ticket</p>
        <p style="margin:0 0 8px;color:#e2e8f0;font-size:13px">Bouclier 20 Matchs — remboursement si 1 erreur sur 20</p>
        <p style="margin:0;color:#e2e8f0;font-size:13px">Garantie Matchs Nuls — 100% si 2 nuls perdants</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center">
        <a href="${appUrl}/compte-optimise-ia"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">
          Configurer mon compte optimise IA
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
          La configuration prend moins de 5 minutes et l'acces est active immediatement.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">
        AlgoPronos AI — Optimisation des paris sportifs par intelligence artificielle.<br>
        <a href="${appUrl}/dashboard/settings" style="color:#7c3aed">Gerer mes preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Invitation à passer en Full Access — c'est de la PROSPECTION, pas du
 * transactionnel : elle part sur le flux marketing (avec désabonnement), pour
 * ne pas polluer la réputation du domaine transactionnel.
 */
export async function sendUpgradeInvitationEmail(p: ActivationPayload): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';
  const { ok } = await sendMarketing({
    to: p.userEmail,
    subject: 'Débloquez le Full Access AlgoPronos AI gratuitement',
    html: buildUpgradeInvitationEmailHtml(p),
    text: `Bonjour ${p.userName || 'Parieur'},\n\nVous utilisez AlgoPronos AI en accès de base. En configurant un compte bookmaker optimisé IA, vous débloquez toutes les fonctionnalités gratuitement.\n\nConfigurez votre compte : ${appUrl}/compte-optimise-ia`,
  });
  return ok;
}

export async function sendConfirmationEmail(email: string, userName?: string): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';
  const firstName = userName?.split(' ')[0];

  const content = `
    ${transactionalHeading('Votre adresse email est confirmée')}
    ${transactionalParagraph(firstName ? `Bonjour ${firstName},` : 'Bonjour,')}
    ${transactionalParagraph('Votre adresse email a bien été confirmée. Vous pouvez dès maintenant consulter nos pronostics IA depuis votre tableau de bord.')}
    ${transactionalInfoBox(`
      <p style="margin:0 0 8px;font-weight:bold;color:#111827;">Débloquer le Full Access</p>
      <p style="margin:0;">Vérifiez votre compte bookmaker depuis votre tableau de bord pour accéder à l'ensemble de nos analyses, sans quota journalier.</p>
    `)}
    ${transactionalButton('Accéder à mon tableau de bord', `${appUrl}/dashboard`)}
  `;

  const { ok } = await sendTransactional({
    to: email,
    subject: 'Votre adresse email est confirmée',
    html: transactionalLayout(content, 'Votre adresse email AlgoPronos AI est confirmée'),
    text: `Votre adresse email est confirmée sur AlgoPronos AI.\n\nAccédez à votre tableau de bord : ${appUrl}/dashboard`,
  });
  return ok;
}

// ─── MobCash Notifications ─────────────────────────────────────────────────

export interface MobcashRequestPayload {
  requestId: string;
  type: 'depot' | 'retrait';
  amount: number;
  bookmaker: string;
  bookmakerId: string;
  phone: string;
  network: string;
  fullName: string;
  withdrawCode?: string;
  email?: string;
  notes?: string;
}

function buildMobcashAdminEmailHtml(p: MobcashRequestPayload): string {
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';
  const typeLabel = p.type === 'depot' ? '💰 DÉPÔT' : '💸 RETRAIT';
  const typeColor = p.type === 'depot' ? '#22c55e' : '#f97316';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">
    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI — MobCash</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700">Nouvelle demande ${typeLabel}</h1>
    </div>
    <div style="padding:28px 32px">
      <div style="background:${typeColor}18;border:1px solid ${typeColor}33;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:32px;font-weight:800;color:${typeColor}">${p.amount.toLocaleString('fr-FR')} FCFA</p>
        <p style="margin:4px 0 0;color:#a0aec0;font-size:13px">${typeLabel} · ${p.bookmaker.toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:10px;overflow:hidden">
        ${[
          ['Nom',              p.fullName],
          ['Téléphone',        p.phone],
          ['Réseau',           p.network],
          ['ID 1xBet',         p.bookmakerId],
          ...(p.withdrawCode ? [['🔑 Code retrait', p.withdrawCode]] : []),
          ['Notes',            p.notes || '—'],
          ['Référence',        p.requestId.slice(0,8).toUpperCase()],
        ].map(([label, value]) => `
          <tr>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px;width:40%;border-bottom:1px solid #1a1a2e">${label}</td>
            <td style="padding:10px 14px;color:#e2e8f0;font-size:13px;font-weight:500;border-bottom:1px solid #1a1a2e">${value}</td>
          </tr>`).join('')}
      </table>
      <div style="text-align:center;margin-top:24px">
        <a href="${appUrl}/admin/mobcash"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px">
          Traiter la demande →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">AlgoPronos AI — Système MobCash 1xBet</p>
    </div>
  </div>
</body>
</html>`;
}

export async function notifyMobcashRequest(p: MobcashRequestPayload): Promise<boolean> {
  const typeLabel = p.type === 'depot' ? 'DÉPÔT' : 'RETRAIT';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

  // Support plusieurs emails séparés par des virgules
  const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAIL || 'fgambakpo@gmail.com')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  const { ok } = await sendInternal({
    to: adminEmails,
    subject: `Demande ${typeLabel} MobCash — ${p.amount.toLocaleString('fr-FR')} FCFA — ${p.fullName}`,
    html: buildMobcashAdminEmailHtml(p),
    text: `Nouvelle demande ${typeLabel} MobCash\n\nMontant : ${p.amount.toLocaleString('fr-FR')} FCFA\nNom : ${p.fullName}\nTél : ${p.phone}\nRéseau : ${p.network}\nID 1xBet : ${p.bookmakerId}\n${p.notes ? `Notes : ${p.notes}\n` : ''}\nTraiter sur : ${appUrl}/admin/mobcash`,
  });
  return ok;
}

// ─── MobCash — Notification client (statut changé) ─────────────────────────

export interface MobcashStatusPayload {
  clientEmail: string;
  clientName: string;
  type: 'depot' | 'retrait';
  amount: number;
  status: 'completed' | 'rejected';
  adminNotes?: string | null;
}

function buildMobcashStatusEmailHtml(p: MobcashStatusPayload): string {
  const firstName  = p.clientName.split(' ')[0];
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com';
  const isOk       = p.status === 'completed';
  const typeLabel  = p.type === 'depot' ? 'dépôt' : 'retrait';
  const amountFmt  = p.amount.toLocaleString('fr-FR');

  const titleText  = isOk
    ? `Votre ${typeLabel} de ${amountFmt} FCFA a été traité ✅`
    : `Votre demande de ${typeLabel} a été rejetée`;

  const bodyText   = isOk
    ? p.type === 'depot'
      ? `Votre compte 1xBet a été crédité de <strong style="color:#fff">${amountFmt} FCFA</strong>. Vous pouvez maintenant l'utiliser sur 1xBet.`
      : `Votre retrait de <strong style="color:#fff">${amountFmt} FCFA</strong> a été envoyé sur votre numéro mobile money.`
    : `Nous n'avons pas pu traiter votre demande de ${typeLabel} de <strong style="color:#fff">${amountFmt} FCFA</strong>.`;

  const statusColor = isOk ? '#22c55e' : '#ef4444';
  const statusIcon  = isOk ? '✅' : '❌';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">

    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI · MobCash</p>
      <h1 style="margin:8px 0 0;font-size:20px;color:#fff;font-weight:700">${titleText}</h1>
    </div>

    <div style="padding:32px">
      <p style="margin:0 0 20px;color:#a0aec0;font-size:15px">Bonjour <strong style="color:#fff">${firstName}</strong>,</p>

      <div style="background:${statusColor}18;border:1px solid ${statusColor}40;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0;font-size:32px">${statusIcon}</p>
        <p style="margin:8px 0 4px;font-size:22px;font-weight:800;color:${statusColor}">${amountFmt} FCFA</p>
        <p style="margin:0;color:#a0aec0;font-size:13px;text-transform:uppercase;letter-spacing:1px">${typeLabel}</p>
      </div>

      <p style="margin:0 0 24px;color:#a0aec0;font-size:14px;line-height:1.6">${bodyText}</p>

      ${p.adminNotes && !isOk ? `
      <div style="background:#0f0f1a;border-radius:10px;padding:16px;margin-bottom:24px;border-left:3px solid #ef4444">
        <p style="margin:0 0 4px;color:#f87171;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Motif</p>
        <p style="margin:0;color:#e2e8f0;font-size:13px;line-height:1.5">${p.adminNotes}</p>
      </div>` : ''}

      <div style="text-align:center">
        <a href="${appUrl}/depot-retrait"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:600;font-size:14px">
          ${isOk ? 'Faire une nouvelle demande' : 'Réessayer'}
        </a>
        <p style="margin:14px 0 0;color:#6b7280;font-size:12px">Des questions ? Répondez directement à cet email.</p>
      </div>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">AlgoPronos AI — MobCash · Dépôt & Retrait 1xBet</p>
    </div>
  </div>
</body>
</html>`;
}

export async function notifyMobcashStatusChange(p: MobcashStatusPayload): Promise<boolean> {
  if (!p.clientEmail) return false;

  const typeLabel = p.type === 'depot' ? 'dépôt' : 'retrait';
  const amountFr = p.amount.toLocaleString('fr-FR');
  // Notification financière : flux transactionnel, objet factuel sans emoji.
  const subject = p.status === 'completed'
    ? `Votre ${typeLabel} de ${amountFr} FCFA a été traité`
    : `Votre demande de ${typeLabel} MobCash`;

  const { ok } = await sendTransactional({
    to: p.clientEmail,
    subject,
    html: buildMobcashStatusEmailHtml(p),
    text: `Bonjour,\n\n${subject}.\nMontant : ${amountFr} FCFA.\n\nPour toute question, répondez à cet email.`,
  });
  return ok;
}

// ─── Admin Notifications ────────────────────────────────────────────────────

export async function notifyAdmin(
  type: 'signup' | 'vip_request', 
  data: any, 
  status?: 'pending' | 'confirmed'
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'fgambakpo@gmail.com';

  let subject = '';
  if (type === 'signup') {
    const statusText = status === 'confirmed' ? '✅ COMPLÉTÉE' : '⏳ EN ATTENTE';
    subject = `🆕 Inscription [${statusText}] : ${data.email}`;
  } else {
    subject = `⭐ Nouvelle demande VIP : ${data.identifier}`;
  }

  const html = `
    <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:10px;background-color:#161b22;color:#c9d1d9;">
      <h2 style="color:#7c3aed">${type === 'signup' ? 'Détails Utilisateur' : 'Demande VIP Reçue'}</h2>
      <p><strong>Statut :</strong> ${status === 'confirmed' ? '<span style="color:#238636">Email Confirmé</span>' : '<span style="color:#f85149">Email non confirmé</span>'}</p>
      <p><strong>Email :</strong> ${data.email || 'N/A'}</p>
      ${data.fullName ? `<p><strong>Nom :</strong> ${data.fullName}</p>` : ''}
      ${data.phone ? `<p><strong>Téléphone :</strong> ${data.phone}</p>` : ''}
      ${data.country ? `<p><strong>Pays :</strong> ${data.country}</p>` : ''}
      ${data.identifier ? `<p><strong>ID Bookmaker :</strong> ${data.identifier}</p>` : ''}
      <p style="margin-top:20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/admin" 
           style="background:#7c3aed;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
           Gérer dans l'Admin
        </a>
      </p>
    </div>
  `;

  const { ok } = await sendInternal({
    to: adminEmail,
    subject,
    html,
    text: `${subject}\n\nEmail : ${data.email || 'N/A'}${data.fullName ? `\nNom : ${data.fullName}` : ''}${data.phone ? `\nTéléphone : ${data.phone}` : ''}${data.identifier ? `\nID Bookmaker : ${data.identifier}` : ''}`,
  });
  return ok;
}
