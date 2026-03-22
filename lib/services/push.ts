/**
 * Web Push Notification Service
 *
 * Env vars required:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — VAPID public key (safe to expose client-side)
 *   VAPID_PRIVATE_KEY             — VAPID private key (server only)
 *   VAPID_EMAIL                   — Contact email for VAPID (e.g. mailto:admin@algopronos.ai)
 *
 * Generate keys once with:
 *   npx web-push generate-vapid-keys
 */

import webpush from 'web-push';

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:contact@algopronos.ai';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(email, pub, priv);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!ensureVapid()) {
    console.warn('[push] VAPID keys not configured — skipping push');
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload),
    );
    return true;
  } catch (err: unknown) {
    // 410 Gone = subscription expired/invalid
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const code = (err as { statusCode: number }).statusCode;
      if (code === 410 || code === 404) return false; // caller should remove this sub
    }
    console.error('[push] Send error:', err);
    return false;
  }
}

export async function broadcastPush(
  subscriptions: PushSubscription[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; expired: string[] }> {
  if (!subscriptions.length) return { sent: 0, failed: 0, expired: [] };
  if (!ensureVapid()) return { sent: 0, failed: subscriptions.length, expired: [] };

  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  for (const sub of subscriptions) {
    const ok = await sendPushNotification(sub, payload);
    if (ok) {
      sent++;
    } else {
      failed++;
      expired.push(sub.endpoint);
    }
  }

  return { sent, failed, expired };
}
