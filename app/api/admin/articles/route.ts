/**
 * /api/admin/articles — CRUD des actualités (admin uniquement).
 *
 * Remplace les Server Actions de app/admin/actualites/actions.ts : elles
 * échouaient en production (requêtes jamais arrivées à Supabase — rejet
 * host/origin des Server Actions derrière proxy) et n'avaient AUCUNE
 * vérification admin. Route API classique = même mécanique que tout le
 * reste du panel admin, qui fonctionne.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function revalidate() {
  revalidatePath('/actualites');
  revalidatePath('/admin/actualites');
}

const ALLOWED_FIELDS = [
  'title', 'slug', 'summary', 'content', 'category', 'tags', 'author', 'status', 'cover_image',
  'article_type', 'match_info', 'ai_analysis',
] as const;

function sanitize(body: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (body[f] !== undefined) row[f] = body[f];
  }
  return row;
}

// GET — liste complète, ou un article complet via ?id=
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const { data, error } = await supabase.from('news_articles').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ article: data });
  }

  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, slug, summary, category, tags, author, status, published_at, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

// POST — création
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) return NextResponse.json({ error: 'Titre obligatoire' }, { status: 400 });

  const row = sanitize(body);
  row.slug = (typeof body.slug === 'string' && body.slug.trim()) ? body.slug.trim() : slugify(body.title);
  if (row.status === 'published') row.published_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('news_articles').insert(row).select().single();

  if (error) {
    const msg = error.code === '23505'
      ? `Le slug "${row.slug}" existe déjà — choisissez-en un autre.`
      : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidate();
  return NextResponse.json({ article: data });
}

// PUT — mise à jour via ?id=
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

  const row = sanitize(body);
  // Passage en "published" → horodate la publication
  if (row.status === 'published') row.published_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('news_articles')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidate();
  return NextResponse.json({ article: data });
}

// DELETE — suppression via ?id=
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('news_articles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidate();
  return NextResponse.json({ deleted: true });
}
