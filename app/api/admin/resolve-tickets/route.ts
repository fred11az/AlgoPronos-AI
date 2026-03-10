import { NextResponse } from 'next/server';
import { getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/resolve-tickets
// Déclenche la résolution automatique des tickets via API-Football (même logique que le cron)
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;

  const res = await fetch(`${baseUrl}/api/cron/resolve-tickets`, {
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
