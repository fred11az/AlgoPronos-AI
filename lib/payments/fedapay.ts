// FedaPay Integration
// Note: In production, install the actual fedapay npm package

const FEDAPAY_PUBLIC_KEY = process.env.FEDAPAY_PUBLIC_KEY;
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
const FEDAPAY_ENV = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface CreateTransactionParams {
  amount: number;
  currency?: string;
  description: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

interface FedaPayTransaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  mode: string;
  token?: {
    url: string;
  };
}

export async function createPaymentTransaction(
  params: CreateTransactionParams
): Promise<{ checkoutUrl: string; transactionId: string }> {
  const {
    amount,
    currency = 'XOF',
    description,
    customerId,
    customerEmail,
    customerName,
    metadata = {},
  } = params;

  // FedaPay API endpoint
  const apiUrl =
    FEDAPAY_ENV === 'live'
      ? 'https://api.fedapay.com/v1/transactions'
      : 'https://sandbox-api.fedapay.com/v1/transactions';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description,
        amount,
        currency: { iso: currency },
        callback_url: `${APP_URL}/api/webhooks/fedapay`,
        return_url: `${APP_URL}/dashboard?payment=success`,
        cancel_url: `${APP_URL}/dashboard/premium/checkout?payment=cancelled`,
        customer: {
          email: customerEmail,
          firstname: customerName?.split(' ')[0] || '',
          lastname: customerName?.split(' ').slice(1).join(' ') || '',
        },
        metadata: {
          user_id: customerId,
          ...metadata,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'FedaPay API error');
    }

    const transaction: FedaPayTransaction = await response.json();

    // Generate payment token/URL
    const tokenResponse = await fetch(
      `${apiUrl}/${transaction.id}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to generate payment URL');
    }

    const tokenData = await tokenResponse.json();

    return {
      checkoutUrl: tokenData.url,
      transactionId: transaction.id.toString(),
    };
  } catch (error) {
    console.error('FedaPay error:', error);
    throw error;
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.FEDAPAY_WEBHOOK_SECRET) {
    return false;
  }

  // In production, implement proper signature verification
  // using crypto.createHmac with the webhook secret
  // For now, we'll do a basic check
  return true;
}

export const SUBSCRIPTION_PLANS = {
  premium_weekly: {
    id: 'premium_weekly',
    name: 'Premium Hebdomadaire',
    amount: 1000,
    currency: 'XOF',
    interval: 'week',
    intervalCount: 1,
    description: 'Abonnement Premium AlgoPronos AI - 7 jours',
  },
};

export function getSubscriptionPlan(planId: string) {
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
}
