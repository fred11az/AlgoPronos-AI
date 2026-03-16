/**
 * Notification Service — Email (Resend) + WhatsApp (Meta Cloud API)
 *
 * Env vars required:
 *   RESEND_API_KEY            — https://resend.com
 *   RESEND_FROM_EMAIL         — ex: "AlgoPronos <no-reply@algopronos.ai>"
 *   WHATSAPP_TOKEN            — Meta WhatsApp Cloud API bearer token
 *   WHATSAPP_PHONE_NUMBER_ID  — Phone Number ID (pas le numéro affiché)
 *   WHATSAPP_TEMPLATE_TICKET  — nom du template Meta approuvé (ex: "ticket_result")
 */

import { Resend } from 'resend';

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

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@algopronos.com>';
  const replyTo = 'support@algopronos.com';
  const statusLabel = p.status === 'won' ? '✅ Ticket GAGNÉ' : p.status === 'lost' ? '❌ Ticket PERDU' : '⚪ Ticket annulé';

  try {
    const { error } = await resend.emails.send({
      from,
      to: p.userEmail,
      subject: `${statusLabel} — Ticket du ${new Date(p.date).toLocaleDateString('fr-FR')} | AlgoPronos AI`,
      replyTo,
      headers: { 'List-Unsubscribe': `<mailto:unsubscribe@algopronos.com?subject=unsubscribe>` },
      html: buildTicketEmailHtml(p),
      text: `${statusLabel} pour votre ticket du ${new Date(p.date).toLocaleDateString('fr-FR')}.\nCote totale : ${p.totalOdds.toFixed(2)}\n\nConsultez vos sélections sur : ${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/dashboard/history`,
    });

    if (error) {
      console.error('[Notification] Resend error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Notification] Email send failed:', err);
    return false;
  }
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
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700">🎉 Compte Full Access activé !</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#a0aec0;font-size:15px">Félicitations <strong style="color:#fff">${firstName}</strong> !</p>
      <p style="margin:0 0 24px;color:#a0aec0;font-size:14px;line-height:1.6">
        Votre compte bookmaker a été vérifié et validé par notre équipe.
        Vous bénéficiez maintenant du <strong style="color:#7c3aed">Full Access AlgoPronos AI</strong>.
      </p>

      <!-- Features unlocked -->
      <div style="background:#0f0f1a;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Ce que vous débloquez</p>
        ${[
          '⚡ Analyses IA illimitées (sans quota journalier)',
          '📊 Probabilités du modèle + value bets visibles',
          '💰 Bankroll IA personnalisé sur chaque ticket',
          '🛡️ Bouclier 20 Matchs — remboursement si 1 erreur sur 20',
          '⚽ Garantie Matchs Nuls — 100% si 2 nuls perdants',
          '🔥 Accès aux cotes prioritaires négociées',
        ].map(f => `<p style="margin:0 0 8px;color:#e2e8f0;font-size:13px">${f}</p>`).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align:center">
        <a href="${appUrl}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">
          Accéder à mon tableau de bord →
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
          Génération de combinés optimisés, analyse en temps réel, historique complet.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">
        AlgoPronos AI — Optimisation des paris sportifs par intelligence artificielle.<br>
        <a href="${appUrl}/dashboard/settings" style="color:#7c3aed">Gérer mes préférences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildRejectionEmailHtml(p: ActivationPayload & { reason?: string }): string {
  const firstName = p.userName?.split(' ')[0] || 'Parieur';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#374151,#1f2937);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI</p>
      <h1 style="margin:8px 0 0;font-size:20px;color:#fff;font-weight:700">Demande de vérification</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#a0aec0;font-size:15px">Bonjour <strong style="color:#fff">${firstName}</strong>,</p>
      <p style="margin:0 0 20px;color:#a0aec0;font-size:14px;line-height:1.6">
        Nous n'avons pas pu valider votre demande d'activation Full Access pour le moment.
      </p>

      ${p.reason ? `
      <div style="background:#ef444411;border:1px solid #ef444433;border-radius:10px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 4px;color:#ef4444;font-size:12px;font-weight:600;text-transform:uppercase">Raison</p>
        <p style="margin:0;color:#fca5a5;font-size:13px">${p.reason}</p>
      </div>` : ''}

      <p style="margin:0 0 24px;color:#a0aec0;font-size:14px;line-height:1.6">
        Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre à nouveau votre demande,
        cliquez ci-dessous ou contactez notre support.
      </p>

      <div style="text-align:center">
        <a href="${appUrl}/unlock-vip"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:13px 30px;border-radius:10px;font-weight:600;font-size:14px">
          Soumettre une nouvelle demande
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">
        AlgoPronos AI — <a href="${appUrl}/dashboard/settings" style="color:#7c3aed">Paramètres</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendActivationEmail(p: ActivationPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@mail.algopronos.com>';
  const replyTo = 'support@algopronos.com';
  try {
    const { error } = await resend.emails.send({
      from,
      to: p.userEmail,
      subject: '🎉 Votre compte Full Access AlgoPronos AI est activé !',
      replyTo,
      html: buildActivationEmailHtml(p),
      text: `Félicitations ${p.userName || 'Parieur'} !\nVotre compte Full Access AlgoPronos AI est désormais activé.\n\nAccédez à votre tableau de bord : ${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/dashboard`,
    });
    if (error) { console.error('[Notification] Activation email error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Notification] Activation email failed:', err);
    return false;
  }
}

export async function sendRejectionEmail(p: ActivationPayload & { reason?: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@mail.algopronos.com>';
  const replyTo = 'support@algopronos.com';
  try {
    const { error } = await resend.emails.send({
      from,
      to: p.userEmail,
      subject: 'Votre demande de vérification AlgoPronos AI',
      replyTo,
      html: buildRejectionEmailHtml(p),
      text: `Bonjour ${p.userName || 'Parieur'},\nNous n'avons pas pu valider votre demande d'activation pour le moment.\n\nMotif : ${p.reason || 'Données non valides'}\n\nVous pouvez soumettre une nouvelle demande ici : ${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/unlock-vip`,
    });
    if (error) { console.error('[Notification] Rejection email error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[Notification] Rejection email failed:', err);
    return false;
  }
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

export async function sendConfirmationEmail(email: string, userName?: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@mail.algopronos.com>';
  const greeting = userName ? `Bonjour ${userName},` : 'Bonjour,';
  
  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: '✅ Votre adresse email est confirmée | AlgoPronos AI',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#e2e8f0;padding:32px;border-radius:16px;border:1px solid #2d2d4a">
          <h2 style="color:#7c3aed">${greeting}</h2>
          <p>Votre adresse email a été confirmée avec succès sur <strong>AlgoPronos AI</strong>.</p>
          <p>Vous avez maintenant accès à l'interface de base pour consulter nos pronostics IA.</p>
          <div style="background:#0f0f1a;padding:20px;border-radius:12px;margin:24px 0">
            <p style="margin:0;color:#a0aec0;font-size:14px">Souhaitez-vous débloquer le <strong>Full Access</strong> ?</p>
            <p style="margin:8px 0 0;font-size:13px;color:#e2e8f0">Suivez les instructions dans votre tableau de bord pour vérifier votre compte bookmaker et accéder à toutes nos analyses.</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/dashboard" 
             style="display:inline-block;background:linear-gradient(135deg, #7c3aed, #06b6d4);color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600">
             Accéder au Dashboard
          </a>
        </div>
      `,
      text: `Votre adresse email est confirmée sur AlgoPronos AI.\nAccédez à votre dashboard : ${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com'}/dashboard`,
    });
    return !error;
  } catch (err) {
    console.error('[Notification] Confirmation email failed:', err);
    return false;
  }
}

// ─── Admin Notifications ────────────────────────────────────────────────────

export async function notifyAdmin(
  type: 'signup' | 'vip_request', 
  data: any, 
  status?: 'pending' | 'confirmed'
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const adminEmail = 'fgambakpo@gmail.com';
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@mail.algopronos.com>';

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

  try {
    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject,
      html,
    });
    return !error;
  } catch (err) {
    console.error('[Notification] Admin alert failed:', err);
    return false;
  }
}
