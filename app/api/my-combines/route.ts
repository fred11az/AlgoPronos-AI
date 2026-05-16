import { NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('combine_usage_log')
    .select(`
      created_at,
      generated_combines (
        id,
        total_odds,
        estimated_probability,
        matches,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[my-combines] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface CombineRow {
    id: string;
    total_odds: number;
    estimated_probability: number;
    matches: unknown[];
    created_at: string;
  }

  const uniqueCombines: CombineRow[] = [];
  const seenIds = new Set<string>();

  for (const item of data || []) {
    const combine = item.generated_combines as unknown as CombineRow | null;
    if (combine && !seenIds.has(combine.id)) {
      seenIds.add(combine.id);
      uniqueCombines.push(combine);
    }
  }

  return NextResponse.json({ combines: uniqueCombines });
}
