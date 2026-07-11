/**
 * POST /api/admin/campaigns — envoi d'un email marketing HTML (admin uniquement).
 *
 * Body: {
 *   subject, title, body, ctaLabel?, ctaUrl?,
 *   recipients: 'all' | string[]   // 'all' = tous les profils avec email, sinon liste d'ids
 *   preview?: boolean               // true = retourne le HTML sans rien envoyer
 * }
 *
 * Garde-fous: confirmation côté client + log du volume (même esprit que le
 * garde-fou anti-email de masse du cron resolve-tickets).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { buildCampaignEmailHtml, sendCampaign, type CampaignPayload } from '@/lib/services/campaign-email';

export const dynamic = 'force-dynamic';
// Envoi séquentiel throttlé à ~2 req/s (limite API Resend) — prévoir de la marge
// pour la croissance de la base d'utilisateurs (300s ≈ 500 destinataires max).
export const maxDuration = 300;

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

  // Aperçu: retourne le HTML rendu, aucun envoi
  if (body.preview === true) {
    return NextResponse.json({ html: buildCampaignEmailHtml(payload, 'Prénom') });
  }

  const supabase = createAdminClient();

  // Mode test: envoi uniquement à l'admin connecté — pour vérifier la config
  // Resend et le rendu réel avant un envoi de masse.
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

  // Résolution des destinataires
  let query = supabase.from('profiles').select('id, email, full_name').not('email', 'is', null);
  if (body.recipients !== 'all') {
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json({ error: 'Sélectionne au moins un destinataire (ou "all")' }, { status: 400 });
    }
    query = query.in('id', body.recipients.slice(0, 1000));
  }
  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipients = (profiles ?? []).filter((p) => p.email);
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'Aucun destinataire avec email' }, { status: 400 });
  }

  console.log(`[campaign] "${payload.subject}" → ${recipients.length} destinataire(s) (mode: ${body.recipients === 'all' ? 'TOUS' : 'sélection'}) par admin ${user.id}`);

  try {
    const result = await sendCampaign(payload, recipients);
    console.log(`[campaign] "${payload.subject}" terminé: ${result.sent} envoyés, ${result.failed} échecs / ${result.total}`);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[campaign] failed:', err);
    const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
