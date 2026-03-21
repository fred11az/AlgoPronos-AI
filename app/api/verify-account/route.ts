import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/verify-account
 * Body: { bookmaker: string, accountId: string }
 *
 * Logique (dans l'ordre) :
 * 1. ID dans admin_approved_bookmaker_ids → optimisé IA ✅ (ajouté manuellement par admin)
 * 2. ID dans vip_verifications status='approved' → optimisé IA ✅ (demande approuvée)
 * 3. ID dans vip_verifications status='pending' → en attente ⏳
 * 4. Sinon → non optimisé ❌
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

  // 1. Vérifier la liste admin (IDs ajoutés directement par les admins)
  const { data: adminEntry } = await supabase
    .from('admin_approved_bookmaker_ids')
    .select('id')
    .ilike('account_id', clean)
    .limit(1)
    .maybeSingle();

  if (adminEntry) {
    return NextResponse.json({ optimized: true });
  }

  // 2. Vérifier les demandes approuvées par les admins
  const { data: approved } = await supabase
    .from('vip_verifications')
    .select('id, status, bookmaker_identifier')
    .ilike('bookmaker_identifier', clean)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (approved) {
    return NextResponse.json({ optimized: true });
  }

  // 3. Soumis mais pas encore approuvé
  const { data: pending } = await supabase
    .from('vip_verifications')
    .select('id, status')
    .ilike('bookmaker_identifier', clean)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (pending) {
    return NextResponse.json({ optimized: false, reason: 'pending_review' });
  }

  return NextResponse.json({ optimized: false, reason: 'not_registered' });
}

