import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/fedapay-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-fedapay-signature');

  // Verify signature if webhook secret is configured
  if (process.env.FEDAPAY_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[FedaPay Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: { name: string; entity: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, entity } = event;
  const supabase = createAdminClient();

  console.log('[FedaPay Webhook]', name, entity?.id);

  if (name === 'transaction.approved') {
    // Deposit confirmed by customer on their phone
    const txId = String(entity.id);
    const { data: request } = await supabase
      .from('mobcash_requests')
      .select('id, amount, bookmaker_id, full_name')
      .eq('fedapay_transaction_id', txId)
      .maybeSingle();

    if (request) {
      await supabase
        .from('mobcash_requests')
        .update({
          status: 'processing',
          fedapay_status: 'approved',
          admin_notes: 'Paiement FedaPay confirmé — en attente du crédit 1xBet',
        })
        .eq('id', request.id);

      console.log(`[FedaPay Webhook] Dépôt confirmé — demande ${request.id}`);
    }

  } else if (name === 'transaction.declined') {
    const txId = String(entity.id);
    await supabase
      .from('mobcash_requests')
      .update({
        status: 'rejected',
        fedapay_status: 'declined',
        admin_notes: 'Paiement FedaPay refusé par le client ou le réseau',
      })
      .eq('fedapay_transaction_id', txId);

  } else if (name === 'payout.approved') {
    // Withdrawal sent to client
    const payoutId = String(entity.id);
    await supabase
      .from('mobcash_requests')
      .update({
        status: 'completed',
        fedapay_status: 'approved',
        processed_at: new Date().toISOString(),
        admin_notes: 'Virement FedaPay envoyé avec succès',
      })
      .eq('fedapay_payout_id', payoutId);

    console.log(`[FedaPay Webhook] Payout approuvé — payout ${payoutId}`);

  } else if (name === 'payout.declined') {
    const payoutId = String(entity.id);
    const errMsg = entity.last_error_message as string | undefined;
    await supabase
      .from('mobcash_requests')
      .update({
        status: 'rejected',
        fedapay_status: 'declined',
        admin_notes: `Virement FedaPay échoué${errMsg ? ` : ${errMsg}` : ''}`,
      })
      .eq('fedapay_payout_id', payoutId);

    console.error(`[FedaPay Webhook] Payout échoué — payout ${payoutId}:`, errMsg);
  }

  return NextResponse.json({ received: true });
}
