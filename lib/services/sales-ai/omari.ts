import Anthropic from '@anthropic-ai/sdk';
import type { SalesProspect, ConversationMessage } from './prospect-service';

/**
 * Omari — le commercial IA d'AlgoPronos (cerveau du Sales AI).
 *
 * Sprint 1 : prompt v0 centré sur les Missions 1-3 (comprendre, confiance, valeur).
 * Le prompt complet (30-40 pages, 8 missions + outils) arrive au Sprint 3.
 * Réf: docs/specs-v2/10-CAHIER-CHARGES-SALES-AI.md
 */

const OMARI_MODEL = process.env.OMARI_MODEL || 'claude-sonnet-5';

const OMARI_SYSTEM_PROMPT = `Tu es Omari, le meilleur commercial d'AlgoPronos (algopronos.com), plateforme de pronostics football par IA pour l'Afrique de l'Ouest francophone. Tu discutes sur Facebook Messenger avec des prospects.

TU N'ES PAS UN CHATBOT. Tu es un conseiller commercial humain, chaleureux et honnête, basé au Bénin, disponible 24/7.

TES MISSIONS ACTUELLES (dans l'ordre, jamais sauter d'étape) :
1. COMPRENDRE le prospect : son prénom, son niveau en paris (débutant/moyen/expert), son bookmaker actuel, ses peurs, ce qu'il cherche vraiment. Écoute AVANT de vendre.
2. CRÉER LA CONFIANCE : honnêteté totale. On peut perdre. Avec discipline, 8-12% de ROI par mois est réaliste — jamais plus, jamais de promesse de richesse.
3. PRÉSENTER LA VALEUR : on ne prédit pas mieux que les bookmakers, on détecte leurs ERREURS de cotes (les "edges"). 10h de recherche condensées en 1 minute.

RÈGLES DE COMMUNICATION (inviolables) :
- Messages COURTS (2-4 lignes max), ton naturel et parlé, tutoiement.
- Chaque message se termine par UNE question pour faire avancer la conversation.
- Utilise le prénom du prospect dès que tu le connais. Référence ce qu'il a dit avant.
- Jamais de pavés, jamais de langage robotique, jamais de pression.
- Jamais de promesse de gains garantis. Les paris comportent un risque, toujours.
- On dit "Compte Optimisé IA", jamais "compte 1xBet".
- Français simple, un émoji de temps en temps (pas plus d'un par message).

PHILOSOPHIE : écoute avant action, confiance avant vente, honnêteté totale, accompagner sans abandonner, ne jamais supposer — toujours demander, adapter ton discours au niveau du prospect.

À CHAQUE RÉPONSE tu produis aussi :
- memory_updates : les nouvelles infos apprises sur le prospect (prénom, niveau, bookmaker, peurs, motivations…), en JSON plat. Vide si rien de nouveau.
- suggested_state : l'état du tunnel qui correspond maintenant au prospect, parmi : NEW, CONTACTED, QUALIFIED, INTERESTED. (Les états suivants seront gérés plus tard.)`;

const OMARI_OUTPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    reply: {
      type: 'string' as const,
      description: 'Le message à envoyer au prospect sur Messenger (court, naturel, termine par une question)',
    },
    memory_updates: {
      type: 'object' as const,
      description: 'Nouvelles informations apprises sur le prospect (JSON plat, clés en français simple)',
      additionalProperties: true,
    },
    suggested_state: {
      type: 'string' as const,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'INTERESTED'],
    },
  },
  required: ['reply', 'memory_updates', 'suggested_state'],
  additionalProperties: false,
};

export interface OmariResponse {
  reply: string;
  memoryUpdates: Record<string, unknown>;
  suggestedState: string;
}

const FALLBACK_REPLY =
  "Salam ! 👋 Moi c'est Omari, d'AlgoPronos. Je suis là pour t'aider à parier plus intelligemment. Dis-moi, tu fais des paris depuis longtemps ?";

/**
 * Génère la réponse d'Omari à partir du message du prospect, de sa mémoire
 * et de l'historique récent. Fallback statique si l'API Claude est indisponible.
 */
export async function generateOmariReply(
  prospect: SalesProspect,
  incomingText: string,
  recentMessages: ConversationMessage[]
): Promise<OmariResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[sales-ai] ANTHROPIC_API_KEY non défini — réponse fallback');
    return { reply: FALLBACK_REPLY, memoryUpdates: {}, suggestedState: 'CONTACTED' };
  }

  const client = new Anthropic({ timeout: 30_000 });

  const historyBlock = recentMessages
    .map((m) => `${m.direction === 'incoming' ? 'PROSPECT' : 'OMARI'}: ${m.message_text}`)
    .join('\n');

  const context = `CONTEXTE DU PROSPECT :
- État du tunnel : ${prospect.state}
- Nom Facebook : ${prospect.facebook_name ?? 'inconnu'}
- Messages échangés : ${prospect.messages_count}
- Mémoire : ${JSON.stringify(prospect.memory)}

HISTORIQUE RÉCENT :
${historyBlock || '(première interaction)'}

NOUVEAU MESSAGE DU PROSPECT :
${incomingText}

Réponds en tant qu'Omari.`;

  try {
    const response = await client.messages.create({
      model: OMARI_MODEL,
      max_tokens: 1000,
      system: OMARI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: OMARI_OUTPUT_SCHEMA,
        },
      },
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Réponse Claude vide');

    const parsed = JSON.parse(block.text) as {
      reply: string;
      memory_updates: Record<string, unknown>;
      suggested_state: string;
    };

    return {
      reply: parsed.reply,
      memoryUpdates: parsed.memory_updates ?? {},
      suggestedState: parsed.suggested_state ?? prospect.state,
    };
  } catch (error) {
    console.error('[sales-ai] Erreur génération Omari:', error);
    return { reply: FALLBACK_REPLY, memoryUpdates: {}, suggestedState: prospect.state };
  }
}
