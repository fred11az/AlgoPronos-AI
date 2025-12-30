import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import {
  createPaymentTransaction,
  getSubscriptionPlan,
} from '@/lib/payments/fedapay';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId = 'premium_weekly' } = body;

    const plan = getSubscriptionPlan(planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create FedaPay transaction
    const { checkoutUrl, transactionId } = await createPaymentTransaction({
      amount: plan.amount,
      currency: plan.currency,
      description: plan.description,
      customerId: user.id,
      customerEmail: user.email,
      customerName: user.full_name || undefined,
      metadata: {
        plan_id: planId,
      },
    });

    // Save transaction to database
    const supabase = await createClient();
    await supabase.from('payment_transactions').insert({
      id: transactionId,
      user_id: user.id,
      amount: plan.amount,
      currency: plan.currency,
      provider: 'fedapay',
      status: 'pending',
      metadata: { plan_id: planId },
    });

    return NextResponse.json({
      checkoutUrl,
      transactionId,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
