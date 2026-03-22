import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/push/subscribe — Save or remove a push subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, action = 'subscribe' } = body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      action?: 'subscribe' | 'unsubscribe';
    };

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
    }

    // Get current user (optional — anonymous sessions skip saving)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Allow anonymous tracking via localStorage (client handles it)
      return NextResponse.json({ ok: true, persisted: false });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('metadata')
      .eq('id', user.id)
      .single();

    const meta = (profile?.metadata as Record<string, unknown>) || {};
    const existing = (meta.push_subscriptions as typeof subscription[]) || [];

    let updated: typeof subscription[];
    if (action === 'unsubscribe') {
      updated = existing.filter(s => s.endpoint !== subscription.endpoint);
    } else {
      // Replace if already exists (endpoint may rotate), otherwise append
      const filtered = existing.filter(s => s.endpoint !== subscription.endpoint);
      updated = [...filtered, subscription];
    }

    await adminSupabase
      .from('profiles')
      .update({ metadata: { ...meta, push_subscriptions: updated } })
      .eq('id', user.id);

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[push/subscribe] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
