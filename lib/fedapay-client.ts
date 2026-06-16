/**
 * FedaPay REST client — uses direct fetch calls for compatibility with Next.js edge/runtime.
 * Credentials: FEDAPAY_SECRET_KEY env var (never committed to code).
 * Production base: https://api.fedapay.com/v1
 */

const FEDAPAY_API_BASE = 'https://api.fedapay.com/v1';

// Modes pour les COLLECTES (dépôts) — tous les réseaux du widget FedaPay Bénin
export const FEDAPAY_COLLECTION_MODES: Record<string, string> = {
  mtn:     'mtn_open',
  moov:    'moov_bj',
  orange:  'orange_bj',
  celcash: 'celcash',
};

// Modes pour les VIREMENTS (retraits) — uniquement MTN et Moov supportés par FedaPay Bénin
export const FEDAPAY_PAYOUT_MODES: Record<string, string> = {
  mtn:  'mtn_open',
  moov: 'moov_bj',
};

// Alias pour compatibilité (utilisé dans /api/admin/mobcash/payout)
export const FEDAPAY_MODES = FEDAPAY_PAYOUT_MODES;

// Pas de déduction sur le montant client — les commissions viennent de 1xBet séparément

function headers() {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) throw new Error('FEDAPAY_SECRET_KEY not configured');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstname: parts[0],
    lastname: parts.length > 1 ? parts.slice(1).join(' ') : parts[0],
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '').replace(/^229/, '');
}

export interface FedaPayTransaction {
  id: number;
  reference: string;
  status: string;
  amount: number;
}

export interface FedaPayPayout {
  id: number;
  reference: string;
  status: string;
  amount: number;
}

export interface FedaPayCustomer {
  id: number;
  firstname: string;
  lastname: string;
}

/**
 * Create a FedaPay collection Transaction and immediately send USSD push.
 * Returns the FedaPay transaction on success.
 * Throws on network/API error — caller should catch and fall back to manual processing.
 */
export async function initiateDeposit(opts: {
  amount: number;
  fullName: string;
  phone: string;
  network: string;   // 'mtn' | 'moov' | 'orange' | 'celcash'
  requestId: string;
}): Promise<FedaPayTransaction> {
  const mode = FEDAPAY_COLLECTION_MODES[opts.network];
  if (!mode) throw new Error(`Réseau non supporté pour FedaPay: ${opts.network}`);

  const { firstname, lastname } = splitName(opts.fullName);
  const phone = normalizePhone(opts.phone);

  // Create transaction
  const createRes = await fetch(`${FEDAPAY_API_BASE}/transactions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      description: `Depot AlgoPronos MobCash #${opts.requestId.slice(0, 8)}`,
      amount: opts.amount,
      currency: { iso: 'XOF' },
      customer: {
        firstname,
        lastname,
        phone_number: { number: phone, country: 'BJ' },
      },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`FedaPay transaction: ${JSON.stringify(createData.errors || createData.message)}`);
  }

  const transaction: FedaPayTransaction = createData['v1/transaction'];

  // Trigger USSD push
  const sendRes = await fetch(`${FEDAPAY_API_BASE}/${mode}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ id: transaction.id }),
  });

  if (!sendRes.ok) {
    const sendData = await sendRes.json();
    throw new Error(`FedaPay sendNow: ${JSON.stringify(sendData.errors || sendData.message)}`);
  }

  return transaction;
}

/**
 * Create a FedaPay Customer (needed before creating a Payout).
 */
export async function createCustomer(opts: {
  fullName: string;
  phone: string;
}): Promise<FedaPayCustomer> {
  const { firstname, lastname } = splitName(opts.fullName);
  const phone = normalizePhone(opts.phone);

  const res = await fetch(`${FEDAPAY_API_BASE}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      firstname,
      lastname,
      phone_number: { number: phone, country: 'BJ' },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`FedaPay customer: ${JSON.stringify(data.errors || data.message)}`);
  }

  return data['v1/customer'];
}

/**
 * Create a FedaPay Payout and send it immediately.
 * amount = request amount minus SERVICE_FEE.
 */
export async function initiatePayout(opts: {
  customerId: number;
  amount: number;   // amount to send (after fee deduction)
  network: string;  // 'mtn' | 'moov'
  requestId: string;
}): Promise<FedaPayPayout> {
  const mode = FEDAPAY_MODES[opts.network];
  if (!mode) throw new Error(`Réseau non supporté pour paiement: ${opts.network}`);

  // Create payout
  const createRes = await fetch(`${FEDAPAY_API_BASE}/payouts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      description: `Retrait AlgoPronos MobCash #${opts.requestId.slice(0, 8)}`,
      amount: opts.amount,
      currency: { iso: 'XOF' },
      mode,
      customer: { id: opts.customerId },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`FedaPay payout create: ${JSON.stringify(createData.errors || createData.message)}`);
  }

  const payout: FedaPayPayout = createData['v1/payout'];

  // Start payout immediately
  const startRes = await fetch(`${FEDAPAY_API_BASE}/payouts/${payout.id}/start`, {
    method: 'PUT',
    headers: headers(),
  });

  if (!startRes.ok) {
    const startData = await startRes.json();
    throw new Error(`FedaPay payout start: ${JSON.stringify(startData.errors || startData.message)}`);
  }

  return payout;
}

/**
 * Verify a FedaPay webhook signature.
 * Header format: "t=<timestamp>,s=<signature>"
 */
export function verifyWebhookSignature(payload: string, header: string | null): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  try {
    const parts = Object.fromEntries(
      header.split(',').map(p => { const [k, v] = p.split('='); return [k, v]; })
    );
    const timestamp = parts['t'];
    const signature = parts['s'];
    if (!timestamp || !signature) return false;

    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
