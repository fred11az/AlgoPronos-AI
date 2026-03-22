'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export default function PushNotifToggle() {
  const [state, setState] = useState<PushState>('loading');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setState(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setState('unsubscribed'));
  }, []);

  async function subscribe() {
    setState('loading');
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');
      setState('unsubscribed');
      return;
    }

    const reg = await registerSW();
    if (!reg) { setState('unsupported'); return; }

    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'unsubscribed'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as string,
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subJson, action: 'subscribe' }),
      });

      setState('subscribed');
    } catch {
      setState('unsubscribed');
    }
  }

  async function unsubscribe() {
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subJson, action: 'unsubscribe' }),
        });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } catch {
      setState('unsubscribed');
    }
  }

  if (state === 'unsupported') return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-light/50 border border-border">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {state === 'subscribed'
          ? <Bell className="h-4 w-4 text-primary" />
          : <BellOff className="h-4 w-4 text-text-muted" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {state === 'subscribed' ? 'Notifications activées' : 'Notifications push'}
        </p>
        <p className="text-xs text-text-muted">
          {state === 'subscribed'
            ? 'Vous serez alerté dès qu\'un ticket est résolu'
            : state === 'denied'
            ? 'Autorisez les notifications dans votre navigateur'
            : 'Recevez les résultats en temps réel'
          }
        </p>
      </div>
      {state === 'loading' ? (
        <Loader2 className="h-4 w-4 text-text-muted animate-spin shrink-0" />
      ) : state === 'subscribed' ? (
        <Button variant="ghost" size="sm" onClick={unsubscribe} className="shrink-0 text-xs">
          Désactiver
        </Button>
      ) : state !== 'denied' ? (
        <Button variant="outline" size="sm" onClick={subscribe} className="shrink-0 text-xs">
          <Bell className="h-3 w-3 mr-1" />
          Activer
        </Button>
      ) : null}
    </div>
  );
}
