/**
 * /api/admin/campaigns — campagnes email marketing (admin uniquement).
 *
 * POST body: {
 *   subject, title, body, ctaLabel?, ctaUrl?,
 *   recipients: 'all' | string[]   // 'all' = tous les profils avec email, sinon liste d'ids
 *   preview?: boolean               // true = retourne le HTML sans rien envoyer
 *   test?: boolean                  // true = envoie uniquement à l'admin connecté
 * }
 * GET ?id=<uuid>  → une campagne (contenu complet, pour "Renvoyer")
 * GET (sans id)   → historique (100 dernières campagnes réellement envoyées)
 *
 * Le contenu est enregistré dans email_campaigns AVANT l'envoi (pas après) :
 * une campagne composée est ainsi toujours consultable/renvoyable, même si
 * l'envoi échoue ou que la fonction est interrompue en cours de route.
 * Aperçus et tests ne sont pas historisés.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { buildCampaignEmailHtml, sendCampaign, type CampaignPayload } from '@/lib/services/campaign-email';

export const dynamic = 'force-dynamic';
// Envoi séquentiel throttlé à ~2 req/s (limite API Resend) — prévoir de la marge
// pour la croissance de la base d'utilisateurs (300s ≈ 500 destinataires max).
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const supabase = createAdminClient();
  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const { data, error } = await supabase.from('email_campaigns').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('id, subject, title, target, total, sent, failed, first_error, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.subject?.trim() || !body?.title?.trim() || !body?.body?.trim()) {
    return NextResponse.json({ error: 'Objet, titre et contenu sont obligatoires' }, { status: 400 });
  }

  const payload: CampaignPayload = {
    subject: String(body.subject).trim(),
    title: String(body.title).trim(),
    body: String(body.body),
    ctaLabel: body.ctaLabel ? String(body.ctaLabel).trim() : undefined,
    ctaUrl: body.ctaUrl ? String(body.ctaUrl).trim() : undefined,
  };

  // Aperçu: retourne le HTML rendu, aucun envoi, rien de sauvegardé
  if (body.preview === true) {
    return NextResponse.json({ html: buildCampaignEmailHtml(payload, 'Prénom') });
  }

  const supabase = createAdminClient();

  // Mode test: envoi uniquement à l'admin connecté — pour vérifier la config
  // Resend et le rendu réel avant un envoi de masse. Non historisé.
  if (body.test === true) {
    const { data: me } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();
    const testEmail = me?.email ?? user.email;
    if (!testEmail) return NextResponse.json({ error: 'Email admin introuvable' }, { status: 400 });

    try {
      const result = await sendCampaign(payload, [{ email: testEmail, full_name: me?.full_name }]);
      console.log(`[campaign] TEST "${payload.subject}" → ${testEmail}: ${result.sent ? 'OK' : `ÉCHEC (${result.firstError})`}`);
      if (result.sent === 0) {
        return NextResponse.json(
          { error: `Échec du test vers ${testEmail}: ${result.firstError ?? 'raison inconnue'}` },
          { status: 502 },
        );
      }
      return NextResponse.json({ ...result, testEmail });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du test';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Résolution des destinataires — les désabonnés du marketing sont exclus
  // dès la requête (obligation légale et condition de délivrabilité : envoyer
  // à quelqu'un qui s'est désabonné génère des plaintes qui dégradent le
  // domaine pour TOUS les envois, y compris les codes de vérification).
  const isAll = body.recipients === 'all';
  let query = supabase
    .from('profiles')
    .select('id, email, full_name')
    .not('email', 'is', null)
    .eq('marketing_opt_out', false);
  if (!isAll) {
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json({ error: 'Sélectionne au moins un destinataire (ou "all")' }, { status: 400 });
    }
    query = query.in('id', body.recipients.slice(0, 1000));
  }
  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deuxième filet : adresses désabonnées sans compte lié (imports, anciens contacts).
  const { data: optOuts } = await supabase.from('email_opt_outs').select('email');
  const blocked = new Set((optOuts ?? []).map((o) => o.email.toLowerCase()));

  const recipients = (profiles ?? []).filter((p) => p.email && !blocked.has(p.email.toLowerCase()));
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire avec email' }, { status: 400 });
  }

  // Sauvegarde AVANT l'envoi — le contenu ne doit jamais dépendre du succès
  // de l'envoi pour être récupérable (voir historique du bug: campagne
  // composée puis perdue, aucune trace, impossible à renvoyer).
  const { data: saved, error: saveErr } = await supabase
    .from('email_campaigns')
    .insert({
      subject: payload.subject,
      title: payload.title,
      body: payload.body,
      cta_label: payload.ctaLabel ?? null,
      cta_url: payload.ctaUrl ?? null,
      target: isAll ? 'all' : 'selection',
      recipient_ids: isAll ? null : recipients.map((r) => r.id),
      total: recipients.length,
      sent_by: user.id,
    })
    .select('id')
    .single();
  if (saveErr) console.error('[campaign] Échec sauvegarde historique:', saveErr);

  console.log(`[campaign] "${payload.subject}" → ${recipients.length} destinataire(s) (mode: ${isAll ? 'TOUS' : 'sélection'}) par admin ${user.id}`);

  try {
    const result = await sendCampaign(payload, recipients);
    console.log(`[campaign] "${payload.subject}" terminé: ${result.sent} envoyés, ${result.failed} échecs / ${result.total}`);

    if (saved?.id) {
      await supabase
        .from('email_campaigns')
        .update({ sent: result.sent, failed: result.failed, first_error: result.firstError })
        .eq('id', saved.id);
    }

    return NextResponse.json({ ...result, campaignId: saved?.id ?? null });
  } catch (err) {
    console.error('[campaign] failed:', err);
    const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
    if (saved?.id) {
      await supabase.from('email_campaigns').update({ first_error: msg }).eq('id', saved.id);
    }
    return NextResponse.json({ error: msg, campaignId: saved?.id ?? null }, { status: 500 });
  }
}
