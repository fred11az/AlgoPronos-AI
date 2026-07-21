import crypto from 'crypto';

/**
 * Intégration Meta Messenger (Graph API).
 * Toutes les fonctions sont "env-gated" : sans les tokens Meta configurés,
 * elles loggent et n'envoient rien — le reste du pipeline fonctionne quand même.
 *
 * Variables d'environnement requises :
 * - META_PAGE_ACCESS_TOKEN : token de la page Facebook (dashboard Messenger)
 * - META_APP_SECRET        : secret de l'app Meta (validation de signature)
 * - META_VERIFY_TOKEN      : chaîne secrète choisie par nous (handshake webhook)
 */

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

export function getVerifyToken(): string | undefined {
  return process.env.META_VERIFY_TOKEN;
}

/**
 * Vérifie la signature X-Hub-Signature-256 d'un payload webhook.
 * Meta signe le corps brut avec l'App Secret (HMAC SHA-256).
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.warn('[sales-ai] META_APP_SECRET non défini — signature non vérifiée (dev uniquement)');
    return process.env.NODE_ENV !== 'production';
  }
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Envoie un message texte à un utilisateur Messenger (par PSID).
 * Retourne true si l'envoi a réussi.
 */
export async function sendTextMessage(recipientPsid: string, text: string): Promise<boolean> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.warn(`[sales-ai] META_PAGE_ACCESS_TOKEN non défini — message non envoyé à ${recipientPsid}: "${text.slice(0, 80)}…"`);
    return false;
  }

  try {
    const res = await fetch(`${GRAPH_API_URL}/me/messages?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        messaging_type: 'RESPONSE',
        message: { text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[sales-ai] Échec envoi Messenger (${res.status}): ${err}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[sales-ai] Erreur réseau envoi Messenger:', error);
    return false;
  }
}

/**
 * Récupère le prénom/nom d'un utilisateur Messenger (si l'app a la permission).
 * Retourne null en cas d'échec — jamais bloquant.
 */
export async function fetchUserProfile(psid: string): Promise<{ firstName?: string; lastName?: string } | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `${GRAPH_API_URL}/${psid}?fields=first_name,last_name&access_token=${token}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { first_name?: string; last_name?: string };
    return { firstName: data.first_name, lastName: data.last_name };
  } catch {
    return null;
  }
}

// ─── Types du payload webhook Messenger ──────────────────────────────────────

export interface MessengerWebhookEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: unknown[];
  };
  postback?: {
    title?: string;
    payload?: string;
  };
}

export interface MessengerWebhookBody {
  object: string;
  entry?: Array<{
    id: string;
    time: number;
    messaging?: MessengerWebhookEvent[];
  }>;
}

/** Extrait les événements de message texte d'un payload webhook. */
export function extractTextEvents(body: MessengerWebhookBody): Array<{ psid: string; text: string }> {
  const events: Array<{ psid: string; text: string }> = [];
  for (const entry of body.entry ?? []) {
    for (const evt of entry.messaging ?? []) {
      const text = evt.message?.text ?? evt.postback?.payload;
      if (evt.sender?.id && text) {
        events.push({ psid: evt.sender.id, text });
      }
    }
  }
  return events;
}
