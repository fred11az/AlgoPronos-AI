/**
 * FedaPay client — uses the official fedapay Node.js SDK.
 * Credentials: FEDAPAY_SECRET_KEY env var (never in code).
 */

import { FedaPay, Transaction, Payout, Customer } from 'fedapay';
import crypto from 'crypto';

// Modes COLLECTES (dépôts) — réseaux disponibles dans le widget FedaPay Bénin
export const FEDAPAY_COLLECTION_MODES: Record<string, string> = {
  mtn:     'mtn_open',
  moov:    'moov_bj',
  orange:  'orange_bj',
  celcash: 'celcash',
};

// Modes VIREMENTS (retraits) — uniquement MTN et Moov supportés par FedaPay Bénin
export const FEDAPAY_PAYOUT_MODES: Record<string, string> = {
  mtn:  'mtn_open',
  moov: 'moov_bj',
};

// Alias utilisé dans /api/admin/mobcash/payout
export const FEDAPAY_MODES = FEDAPAY_PAYOUT_MODES;

// FedaPay SDK errors extend a custom Base class that does NOT extend native Error.
// The real API error message is in err.errorMessage (from response data['message']).
function fedapayErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e['errorMessage'] === 'string' && e['errorMessage']) return e['errorMessage'];
    if (e['errors'] && typeof e['errors'] === 'object') {
      const msgs = Object.values(e['errors'] as Record<string, string[]>).flat();
      if (msgs.length) return msgs.join(', ');
    }
    if (typeof e['message'] === 'string' && e['message']) return e['message'];
    return JSON.stringify(err);
  }
  return String(err);
}

function init() {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) throw new Error('FEDAPAY_SECRET_KEY not configured');
  FedaPay.setApiKey(key);
  FedaPay.setEnvironment('live');
}

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstname: parts[0],
    lastname: parts.length > 1 ? parts.slice(1).join(' ') : parts[0],
  };
}

// Strip spaces, dashes, country prefix — keeps 8-digit Benin number
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '').replace(/^229/, '');
}

/**
 * Initiate a FedaPay deposit collection.
 * Amount passed is what the client should be debited — FedaPay's 1.8% fee is absorbed
 * by dividing by 1.018 before creating the transaction.
 */
export async function initiateDeposit(opts: {
  amount: number;
  fullName: string;
  phone: string;
  network: string;
  requestId: string;
}): Promise<{ id: number }> {
  try {
    init();
    const mode = FEDAPAY_COLLECTION_MODES[opts.network];
    if (!mode) throw new Error(`Réseau non supporté pour FedaPay: ${opts.network}`);

    const { firstname, lastname } = splitName(opts.fullName);
    const phone = normalizePhone(opts.phone);

    // FedaPay adds 1.8% on top of the transaction amount — divide by 1.018 so the
    // client is debited exactly opts.amount (what they entered in the form).
    const collectionAmount = Math.round(opts.amount / 1.018);

    const transaction = await Transaction.create({
      description: `Depot AlgoPronos MobCash #${opts.requestId.slice(0, 8)}`,
      amount: collectionAmount,
      currency: { iso: 'XOF' },
      customer: {
        firstname,
        lastname,
        phone_number: { number: phone, country: 'BJ' },
      },
    });

    // Generate payment token + send USSD push (SDK handles both steps)
    await transaction.sendNow(mode);

    return { id: transaction.id };
  } catch (err) {
    throw new Error(fedapayErrorMessage(err));
  }
}

/**
 * Create a FedaPay customer record (required before payout).
 */
export async function createCustomer(opts: {
  fullName: string;
  phone: string;
}): Promise<{ id: number }> {
  try {
    init();
    const { firstname, lastname } = splitName(opts.fullName);
    const phone = normalizePhone(opts.phone);

    const customer = await Customer.create({
      firstname,
      lastname,
      phone_number: { number: phone, country: 'BJ' },
    });

    return { id: customer.id };
  } catch (err) {
    throw new Error(fedapayErrorMessage(err));
  }
}

/**
 * Create a FedaPay payout and send it immediately.
 * Client receives the full requested amount — commission comes from 1xBet separately.
 */
export async function initiatePayout(opts: {
  customerId: number;
  amount: number;
  network: string;
  requestId: string;
}): Promise<{ id: number }> {
  try {
    init();
    const mode = FEDAPAY_PAYOUT_MODES[opts.network];
    if (!mode) throw new Error(`Réseau non supporté pour virement: ${opts.network}`);

    const payout = await Payout.create({
      description: `Retrait AlgoPronos MobCash #${opts.requestId.slice(0, 8)}`,
      amount: opts.amount,
      currency: { iso: 'XOF' },
      mode,
      customer: { id: opts.customerId },
    });

    // SDK calls PUT /v1/payouts/start with { payouts: [{ id }] }
    await payout.sendNow();

    return { id: payout.id };
  } catch (err) {
    throw new Error(fedapayErrorMessage(err));
  }
}

/**
 * Verify a FedaPay webhook signature.
 * Header format sent by FedaPay: "t=<timestamp>,s=<hex-signature>"
 */
export function verifyWebhookSignature(payload: string, header: string | null): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  try {
    const parts = Object.fromEntries(
      header.split(',').map(p => { const [k, ...rest] = p.split('='); return [k, rest.join('=')]; })
    );
    const timestamp = parts['t'];
    const signature = parts['s'];
    if (!timestamp || !signature) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
