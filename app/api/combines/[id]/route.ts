import { NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import { getAnonymousSessionId } from '@/lib/anonymous';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Must have either an authenticated user or an anonymous cookie
  const user = await getCurrentUser();
  const anonymousCookieId = !user ? await getAnonymousSessionId() : null;

  if (!user && !anonymousCookieId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('generated_combines')
    .select('*')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ combine: data });
}
