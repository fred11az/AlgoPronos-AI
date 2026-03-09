import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/verify-account
 * Body: { bookmaker: string, accountId: string }
 *
 * Logique:
 * - Si l'accountId est dans vip_verifications avec status='approved' → optimisé IA ✅
 * - Sinon → non optimisé IA ❌
 *
 * Délai artificiel simulé côté client (pas côté serveur).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookmaker, accountId } = body as { bookmaker?: string; accountId?: string };

  if (!bookmaker || !accountId) {
    return NextResponse.json({ error: 'bookmaker et accountId requis' }, { status: 400 });
  }

  const clean = accountId.trim().toLowerCase();
  if (clean.length < 2) {
    return NextResponse.json({ optimized: false, reason: 'invalid_id' });
  }

  const supabase = createAdminClient();

  // Cherche si l'ID a été soumis ET approuvé par un admin AlgoPronos
  const { data } = await supabase
    .from('vip_verifications')
    .select('id, status, bookmaker_identifier')
    .ilike('bookmaker_identifier', clean)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ optimized: true });
  }

  // Vérifier aussi si l'ID a été soumis mais est encore en attente
  const { data: pending } = await supabase
    .from('vip_verifications')
    .select('id, status')
    .ilike('bookmaker_identifier', clean)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (pending) {
    // Soumis mais pas encore approuvé
    return NextResponse.json({ optimized: false, reason: 'pending_review' });
  }

  return NextResponse.json({ optimized: false, reason: 'not_registered' });
}
