/**
 * Client email unifié — séparation stricte des flux transactionnel / marketing.
 *
 * POURQUOI CE MODULE
 * ------------------
 * Gmail classe le courrier en onglets (Principale / Promotions) à partir de
 * signaux structurels. Les deux plus déterminants sont :
 *
 *   1. L'en-tête `List-Unsubscribe` — Gmail le lit comme "ceci est du courrier
 *      de masse". Il est OBLIGATOIRE sur les campagnes marketing, et il doit
 *      être ABSENT des emails transactionnels (OTP, activation de compte,
 *      confirmation de paiement…). Historiquement il était posé sur tous nos
 *      envois, y compris l'activation Full Access : c'est la cause n°1 du
 *      classement en Promotions.
 *
 *   2. Le domaine d'envoi — Gmail construit une réputation par domaine. Faire
 *      partir les campagnes ET les OTP depuis la même adresse contamine le flux
 *      transactionnel : une fois le domaine identifié comme promotionnel, tout
 *      son courrier suit, y compris les codes de vérification.
 *
 * Ce module rend ces deux règles impossibles à enfreindre par accident :
 * on choisit un flux, et le flux impose l'en-tête et l'expéditeur corrects.
 *
 * CONFIGURATION DNS (à faire une fois, hors code — cf. docs/EMAIL-DELIVERABILITY.md)
 * Deux sous-domaines distincts vérifiés dans Resend, avec SPF/DKIM/DMARC :
 *   - transactionnel : algopronos.com          → suivi ouverture/clic DÉSACTIVÉ
 *   - marketing      : mail.algopronos.com     → suivi autorisé
 */

import { Resend } from 'resend';

const DEFAULT_TRANSACTIONAL_FROM = 'AlgoPronos AI <no-reply@algopronos.com>';
const DEFAULT_MARKETING_FROM = 'AlgoPronos AI <news@mail.algopronos.com>';
const DEFAULT_REPLY_TO = 'support@algopronos.com';

export interface SendResult {
  ok: boolean;
  error?: string;
}

interface BaseEmailInput {
  /** Destinataire(s). Un tableau n'est acceptable que pour les envois internes. */
  to: string | string[];
  subject: string;
  html: string;
  /** Version texte brut. Fortement recommandée : son absence est un signal négatif. */
  text?: string;
  replyTo?: string;
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY non configurée — envoi ignoré');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Email TRANSACTIONNEL : déclenché par une action de l'utilisateur et attendu
 * par lui (code OTP, confirmation d'email, activation Full Access, statut d'un
 * dépôt/retrait, refus ou suspension d'accès).
 *
 * Règles appliquées automatiquement :
 *   - AUCUN en-tête List-Unsubscribe (on ne se désabonne pas d'un code de
 *     sécurité — le poser ferait basculer le message en Promotions).
 *   - Expéditeur sur le domaine transactionnel, isolé du marketing.
 *   - Reply-To réel : une adresse qui répond améliore la réputation.
 */
export async function sendTransactional(input: BaseEmailInput): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: 'RESEND_API_KEY manquante' };

  const from =
    process.env.RESEND_TRANSACTIONAL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    DEFAULT_TRANSACTIONAL_FROM;

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo || DEFAULT_REPLY_TO,
      html: input.html,
      text: input.text,
      // Volontairement AUCUN header List-Unsubscribe ici.
    });

    if (error) {
      console.error('[email:transactional] Échec Resend:', error);
      return { ok: false, error: error.message || String(error) };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email:transactional] Erreur envoi:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Email MARKETING : campagnes, invitations à l'upgrade, annonces produit.
 *
 * Règles appliquées automatiquement :
 *   - En-tête List-Unsubscribe + List-Unsubscribe-Post (désabonnement en un
 *     clic). Exigé par Gmail depuis février 2024 pour les expéditeurs de masse :
 *     l'omettre ne ramène pas en Principale, ça envoie en SPAM.
 *   - Expéditeur sur le sous-domaine marketing, pour que la réputation
 *     promotionnelle ne contamine pas les OTP.
 *
 * NB : un email marketing classé en Promotions est le comportement NORMAL de
 * Gmail. L'objectif ici n'est pas de le forcer en Principale (impossible et
 * risqué), mais d'empêcher qu'il entraîne le transactionnel avec lui.
 */
export async function sendMarketing(
  input: Omit<BaseEmailInput, 'to'> & { to: string; unsubscribeUrl?: string }
): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: 'RESEND_API_KEY manquante' };

  const from =
    process.env.RESEND_MARKETING_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    DEFAULT_MARKETING_FROM;

  const unsubMailto = 'mailto:unsubscribe@algopronos.com?subject=unsubscribe';
  const listUnsubscribe = input.unsubscribeUrl
    ? `<${input.unsubscribeUrl}>, <${unsubMailto}>`
    : `<${unsubMailto}>`;

  const headers: Record<string, string> = { 'List-Unsubscribe': listUnsubscribe };
  // Le désabonnement en un clic n'est valide que sur une URL HTTPS.
  if (input.unsubscribeUrl) {
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo || DEFAULT_REPLY_TO,
      headers,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return { ok: false, error: error.message || String(error) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Email INTERNE (alertes admin). Passe par le flux transactionnel mais sans
 * Reply-To public.
 */
export async function sendInternal(input: BaseEmailInput): Promise<SendResult> {
  return sendTransactional({ ...input, replyTo: input.replyTo });
}
