import { createAdminClient } from '@/lib/supabase/server';

/**
 * Gestion des prospects Sales AI (tables sales_prospects / sales_conversations).
 * Backend uniquement — service role, jamais exposé côté client.
 */

export interface SalesProspect {
  id: string;
  facebook_psid: string;
  facebook_name: string | null;
  profile_id: string | null;
  state: string;
  memory: Record<string, unknown>;
  bookmaker: string | null;
  bookmaker_account_id: string | null;
  messages_count: number;
  last_interaction_at: string | null;
  created_at: string;
}

export interface ConversationMessage {
  direction: 'incoming' | 'outgoing';
  message_text: string;
  created_at: string;
}

/** Récupère un prospect par PSID Facebook, le crée s'il n'existe pas (état NEW). */
export async function getOrCreateProspect(
  psid: string,
  facebookName?: string | null
): Promise<SalesProspect> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('sales_prospects')
    .select('*')
    .eq('facebook_psid', psid)
    .maybeSingle();

  if (existing) {
    // Complète le nom si on vient seulement de l'obtenir
    if (!existing.facebook_name && facebookName) {
      await supabase
        .from('sales_prospects')
        .update({ facebook_name: facebookName })
        .eq('id', existing.id);
      existing.facebook_name = facebookName;
    }
    return existing as SalesProspect;
  }

  const { data: created, error } = await supabase
    .from('sales_prospects')
    .insert({
      facebook_psid: psid,
      facebook_name: facebookName ?? null,
      state: 'NEW',
      memory: {},
    })
    .select('*')
    .single();

  if (error || !created) {
    throw new Error(`[sales-ai] Impossible de créer le prospect ${psid}: ${error?.message}`);
  }
  return created as SalesProspect;
}

/** Journalise un message (entrant ou sortant) et met à jour les compteurs du prospect. */
export async function logMessage(
  prospectId: string,
  direction: 'incoming' | 'outgoing',
  text: string,
  stateAtMessage: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from('sales_conversations').insert({
    prospect_id: prospectId,
    direction,
    message_text: text,
    state_at_message: stateAtMessage,
    metadata,
  });

  const { data: prospect } = await supabase
    .from('sales_prospects')
    .select('messages_count')
    .eq('id', prospectId)
    .single();

  await supabase
    .from('sales_prospects')
    .update({
      messages_count: (prospect?.messages_count ?? 0) + 1,
      last_interaction_at: new Date().toISOString(),
    })
    .eq('id', prospectId);
}

/** Derniers messages de la conversation (ordre chronologique) pour le contexte Claude. */
export async function getRecentMessages(
  prospectId: string,
  limit = 20
): Promise<ConversationMessage[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('sales_conversations')
    .select('direction, message_text, created_at')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data ?? []) as ConversationMessage[]).reverse();
}

/** Change l'état du tunnel d'un prospect. */
export async function updateProspectState(prospectId: string, newState: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('sales_prospects').update({ state: newState }).eq('id', prospectId);
}

/** Fusionne de nouvelles informations dans la mémoire du prospect (merge superficiel). */
export async function mergeProspectMemory(
  prospectId: string,
  updates: Record<string, unknown>
): Promise<void> {
  if (!updates || Object.keys(updates).length === 0) return;
  const supabase = createAdminClient();

  const { data: prospect } = await supabase
    .from('sales_prospects')
    .select('memory')
    .eq('id', prospectId)
    .single();

  const merged = { ...((prospect?.memory as Record<string, unknown>) ?? {}), ...updates };
  await supabase.from('sales_prospects').update({ memory: merged }).eq('id', prospectId);
}
