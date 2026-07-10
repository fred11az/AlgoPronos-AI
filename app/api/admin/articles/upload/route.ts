/**
 * POST /api/admin/articles/upload — upload d'une image de couverture d'article.
 * Multipart form-data (champ "file"), admin uniquement. Stockée dans le bucket
 * public "news-covers" via le service role ; retourne l'URL publique.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  if (!(await checkIsAdmin(user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Champ "file" manquant' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Format non supporté (JPEG, PNG ou WebP uniquement)' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image trop lourde (5 Mo maximum)' }, { status: 400 });
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('news-covers')
    .upload(path, bytes, { contentType: file.type, cacheControl: '31536000' });

  if (error) {
    console.error('[articles/upload] Storage error:', error);
    return NextResponse.json({ error: `Échec de l'upload: ${error.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from('news-covers').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
