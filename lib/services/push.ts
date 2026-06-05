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
 *
 * NOTE: web-push is an optional dependency. If not installed, push notifications
 * are silently disabled (all functions return false / empty results).
 */

// dynamic import — typed loosely since web-push may not be installed
let webpush: { setVapidDetails: Function; sendNotification: Function } | null = null;
let vapidConfigured = false;

async function loadWebPush() {
  if (webpush) return webpush;
  try {
    webpush = (await import('web-push')).default;
  } catch {
    // web-push not installed — push notifications disabled
    webpush = null;
  }
  return webpush;
}

async function ensureVapid(): Promise<boolean> {
  if (vapidConfigured) return true;
  const lib = await loadWebPush();
  if (!lib) return false;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:contact@algopronos.ai';
  if (!pub || !priv) return false;
  lib.setVapidDetails(email, pub, priv);
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
  const ok = await ensureVapid();
  if (!ok) {
    console.warn('[push] VAPID keys not configured or web-push not installed — skipping push');
    return false;
  }

  try {
    if (!webpush) return false;
    await webpush.sendNotification(
      subscription,
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
  const ok = await ensureVapid();
  if (!ok) return { sent: 0, failed: subscriptions.length, expired: [] };

  let sent = 0;
  let failed = 0;
  const expired: string[] = [];

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub, payload);
    if (result) {
      sent++;
    } else {
      failed++;
      expired.push(sub.endpoint);
    }
  }

  return { sent, failed, expired };
}
