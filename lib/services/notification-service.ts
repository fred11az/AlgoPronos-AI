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
        Vous recevez cet email car vous avez activé les notifications résultats sur AlgoPronos AI.
        <br>Pour vous désabonner, rendez-vous dans vos <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai'}/dashboard/settings" style="color:#7c3aed">paramètres</a>.
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
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'AlgoPronos AI <no-reply@algopronos.ai>';
  const statusLabel = p.status === 'won' ? '✅ Ticket GAGNÉ' : p.status === 'lost' ? '❌ Ticket PERDU' : '⚪ Ticket annulé';

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: p.userEmail,
      subject: `${statusLabel} — Ticket du ${new Date(p.date).toLocaleDateString('fr-FR')} | AlgoPronos AI`,
      html: buildTicketEmailHtml(p),
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
