import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/payments/fedapay';

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('X-FedaPay-Signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(payload);
    const { entity, name } = data;

    // Handle different event types
    if (name === 'transaction.approved' || entity?.status === 'approved') {
      const transactionId = entity.id?.toString();
      const metadata = entity.custom_metadata || entity.metadata || {};
      const userId = metadata.user_id;

      if (!userId) {
        console.error('No user_id in transaction metadata');
        return new Response('Missing user_id', { status: 400 });
      }

      const supabase = await createAdminClient();

      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      // Calculate subscription dates
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for weekly

      // Create subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: metadata.plan_id || 'premium_weekly',
          amount: entity.amount || 1000,
          currency: entity.currency?.iso || 'XOF',
          payment_method: 'fedapay',
          payment_reference: transactionId,
          payment_status: 'completed',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
      }

      // Update user tier (this will also be done by the trigger)
      await supabase
        .from('profiles')
        .update({ tier: 'premium' })
        .eq('id', userId);

      console.log(`Premium activated for user ${userId}`);
    }

    if (name === 'transaction.declined' || entity?.status === 'declined') {
      const transactionId = entity.id?.toString();

      const supabase = await createAdminClient();

      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook processing error', { status: 500 });
  }
}
