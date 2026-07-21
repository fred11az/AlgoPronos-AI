import { NextRequest, NextResponse } from 'next/server';
import {
  verifySignature,
  getVerifyToken,
  sendTextMessage,
  fetchUserProfile,
  extractTextEvents,
  type MessengerWebhookBody,
} from '@/lib/services/sales-ai/meta-messenger';
import {
  getOrCreateProspect,
  logMessage,
  getRecentMessages,
  updateProspectState,
  mergeProspectMemory,
} from '@/lib/services/sales-ai/prospect-service';
import { generateOmariReply } from '@/lib/services/sales-ai/omari';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/messenger/webhook — handshake de vérification Meta.
 * Meta appelle cette URL avec hub.verify_token ; on renvoie hub.challenge si OK.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  const verifyToken = getVerifyToken();
  if (!verifyToken) {
    return NextResponse.json({ error: 'META_VERIFY_TOKEN non configuré' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/messenger/webhook — réception des messages Messenger.
 * Pipeline Sprint 1 :
 *   message reçu → prospect chargé/créé → mémoire + historique chargés
 *   → Omari (Claude) génère la réponse → mémoire/état mis à jour
 *   → réponse envoyée via Graph API → tout est journalisé.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get('x-hub-signature-256');
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let body: MessengerWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true });
  }

  const events = extractTextEvents(body);

  for (const event of events) {
    try {
      await handleIncomingMessage(event.psid, event.text);
    } catch (error) {
      // On n'échoue jamais le webhook entier pour un message : Meta retenterait tout.
      console.error(`[sales-ai] Erreur traitement message de ${event.psid}:`, error);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleIncomingMessage(psid: string, text: string): Promise<void> {
  // 1. Charger ou créer le prospect (avec son nom Facebook si dispo)
  const profile = await fetchUserProfile(psid);
  const name = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : null;
  const prospect = await getOrCreateProspect(psid, name);

  // 2. Journaliser le message entrant
  await logMessage(prospect.id, 'incoming', text, prospect.state);

  // 3. Charger l'historique récent et générer la réponse d'Omari
  const recentMessages = await getRecentMessages(prospect.id);
  const omari = await generateOmariReply(prospect, text, recentMessages);

  // 4. Mettre à jour mémoire et état AVANT d'envoyer (cohérence si l'envoi échoue)
  await mergeProspectMemory(prospect.id, omari.memoryUpdates);
  if (omari.suggestedState !== prospect.state) {
    await updateProspectState(prospect.id, omari.suggestedState);
  }

  // 5. Envoyer la réponse et la journaliser
  const sent = await sendTextMessage(psid, omari.reply);
  await logMessage(prospect.id, 'outgoing', omari.reply, omari.suggestedState, { sent });
}
