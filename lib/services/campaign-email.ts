/**
 * Campagnes email marketing (admin) — template HTML maison AlgoPronos + envoi Resend.
 *
 * Le contenu est du texte brut (paragraphes séparés par une ligne vide) ;
 * une ligne "![légende](https://…)" insère une image, comme dans les articles.
 */
import { sendMarketing } from '@/lib/services/email/client';

export interface CampaignPayload {
  subject: string;
  /** Titre affiché dans le bandeau de l'email. */
  title: string;
  /** Corps: paragraphes séparés par une ligne vide, lignes ![légende](url) pour les images. */
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CampaignRecipient {
  email: string;
  full_name?: string | null;
}

const INLINE_IMAGE_RE = /^!\[([^\]]*)\]\((https?:\/\/\S+)\)$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCampaignEmailHtml(p: CampaignPayload, recipientName?: string | null): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.com';
  const firstName = recipientName?.split(' ')[0];
  const greeting = firstName ? `Bonjour ${escapeHtml(firstName)},` : 'Bonjour,';

  const blocks = p.body.split(/\n\n+/).filter(Boolean).map((para) => {
    const img = para.trim().match(INLINE_IMAGE_RE);
    if (img) {
      const caption = img[1] ? `<p style="margin:6px 0 0;color:#6b7280;font-size:11px;font-style:italic;text-align:center">${escapeHtml(img[1])}</p>` : '';
      return `<div style="margin:0 0 20px"><img src="${img[2]}" alt="${escapeHtml(img[1])}" style="width:100%;border-radius:12px;display:block" />${caption}</div>`;
    }
    return `<p style="margin:0 0 16px;color:#a0aec0;font-size:14px;line-height:1.7">${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  const cta = p.ctaLabel && p.ctaUrl
    ? `<div style="text-align:center;margin:28px 0 8px">
        <a href="${p.ctaUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px">
          ${escapeHtml(p.ctaLabel)}
        </a>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #2d2d4a">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:28px 32px">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:600">AlgoPronos AI</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700">${escapeHtml(p.title)}</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="margin:0 0 20px;color:#e2e8f0;font-size:15px">${greeting}</p>
      ${blocks}
      ${cta}
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #2d2d4a;text-align:center">
      <p style="margin:0;color:#4a4a6a;font-size:11px">
        AlgoPronos AI — Pronostics sportifs par intelligence artificielle.<br>
        <a href="${appUrl}/dashboard/settings" style="color:#7c3aed">Gérer mes préférences</a>
        · <a href="mailto:unsubscribe@algopronos.com?subject=unsubscribe" style="color:#4a4a6a">Se désinscrire</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Version texte brut de la campagne. Un email HTML sans alternative texte est
 * un signal négatif pour les filtres — on la génère systématiquement.
 */
export function campaignPlainText(p: CampaignPayload, recipientName?: string | null): string {
  const firstName = recipientName?.split(' ')[0];
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const body = p.body
    .split(/\n\n+/)
    .filter(Boolean)
    .map((para) => {
      const img = para.trim().match(INLINE_IMAGE_RE);
      return img ? (img[1] ? `[Image : ${img[1]}]` : '') : para;
    })
    .filter(Boolean)
    .join('\n\n');

  const cta = p.ctaLabel && p.ctaUrl ? `\n\n${p.ctaLabel} : ${p.ctaUrl}` : '';

  return `${greeting}\n\n${body}${cta}\n\n—\nAlgoPronos AI — Pronostics sportifs par intelligence artificielle.\nSe désinscrire : unsubscribe@algopronos.com`;
}

export interface CampaignSendResult {
  total: number;
  sent: number;
  failed: number;
  /** Premier message d'erreur Resend rencontré — pour diagnostiquer depuis l'UI. */
  firstError: string | null;
}

/**
 * Envoie la campagne par lots de 10 (limite de débit Resend).
 * Retourne les compteurs — les échecs individuels sont loggés, pas bloquants.
 */
export async function sendCampaign(
  payload: CampaignPayload,
  recipients: CampaignRecipient[],
): Promise<CampaignSendResult> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configurée');
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

  let sent = 0;
  let failed = 0;
  let firstError: string | null = null;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // L'API Resend limite à 2 requêtes/seconde. Un envoi en parallèle (Promise.all
  // par lots de 10) déclenchait des 429 "Too Many Requests" en cascade — c'est
  // la cause du "10/92 délivrés" observé en prod. Envoi séquentiel avec un délai
  // de sécurité, + retry avec backoff en cas de 429 malgré tout.
  const MIN_INTERVAL_MS = 550; // < 2 req/s avec marge
  const MAX_RETRIES = 3;

  for (const r of recipients) {
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const { ok, error } = await sendMarketing({
          to: r.email,
          subject: payload.subject,
          html: buildCampaignEmailHtml(payload, r.full_name),
          text: campaignPlainText(payload, r.full_name),
          unsubscribeUrl: `${appUrl}/api/email/unsubscribe?email=${encodeURIComponent(r.email)}`,
        });

        if (!ok) {
          const isRateLimited = /rate_limit|429|too many/i.test(error ?? '');
          if (isRateLimited && attempt <= MAX_RETRIES) {
            console.warn(`[campaign] Rate limit — retry ${attempt}/${MAX_RETRIES} pour ${r.email}`);
            await sleep(1000 * attempt);
            continue;
          }
          console.error(`[campaign] Échec envoi à ${r.email}:`, error);
          if (!firstError) firstError = error ?? 'erreur inconnue';
          failed++;
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`[campaign] Échec envoi à ${r.email}:`, err);
        if (!firstError) firstError = err instanceof Error ? err.message : String(err);
        failed++;
      }
      break;
    }
    await sleep(MIN_INTERVAL_MS);
  }

  return { total: recipients.length, sent, failed, firstError };
}
