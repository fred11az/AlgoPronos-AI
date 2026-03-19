import { NextResponse } from 'next/server';
import { resolvePendingPredictions } from '@/lib/services/prediction/resolver';

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret (Security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('[cron] Starting prediction resolution...');
    await resolvePendingPredictions();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[cron] Resolution failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
