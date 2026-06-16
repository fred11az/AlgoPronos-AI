import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { createCustomer, initiatePayout, FEDAPAY_MODES, SERVICE_FEE } from '@/lib/fedapay-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch the request
  const { data: request, error: fetchErr } = await supabase
    .from('mobcash_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !request) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  if (request.type !== 'retrait') {
    return NextResponse.json({ error: 'Uniquement pour les retraits' }, { status: 400 });
  }

  if (!FEDAPAY_MODES[request.network]) {
    return NextResponse.json(
      { error: `Réseau "${request.network}" non supporté pour les virements automatiques. Effectuez le paiement manuellement.` },
      { status: 422 }
    );
  }

  if (request.status === 'completed' || request.status === 'rejected') {
    return NextResponse.json({ error: 'Cette demande est déjà finalisée' }, { status: 409 });
  }

  const payoutAmount = request.amount - SERVICE_FEE;
  if (payoutAmount < 500) {
    return NextResponse.json(
      { error: `Montant après frais (${payoutAmount} FCFA) trop faible pour un virement` },
      { status: 422 }
    );
  }

  try {
    // Create FedaPay customer
    const customer = await createCustomer({
      fullName: request.full_name,
      phone: request.phone,
    });

    // Create and send payout
    const payout = await initiatePayout({
      customerId: customer.id,
      amount: payoutAmount,
      network: request.network,
      requestId: request.id,
    });

    // Update request status
    await supabase
      .from('mobcash_requests')
      .update({
        status: 'processing',
        fedapay_payout_id: String(payout.id),
        fedapay_status: 'pending',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        admin_notes: `Virement FedaPay lancé — ${payoutAmount.toLocaleString('fr-FR')} FCFA (frais: ${SERVICE_FEE} FCFA)`,
      })
      .eq('id', request.id);

    return NextResponse.json({
      success: true,
      payout_id: payout.id,
      payout_amount: payoutAmount,
      service_fee: SERVICE_FEE,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur FedaPay';
    console.error('[Admin Payout] FedaPay error:', err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
