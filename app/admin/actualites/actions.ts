'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ArticlePayload {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  cover_image?: string;
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

export async function autoSlug(title: string): Promise<string> {
  return slugify(title);
}

export async function createArticle(payload: ArticlePayload) {
  const supabase = createAdminClient();
  const slug = payload.slug || slugify(payload.title);

  const { data, error } = await supabase
    .from('news_articles')
    .insert({ ...payload, slug })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/actualites');
  revalidatePath('/admin/actualites');
  return data;
}

export async function updateArticle(id: string, payload: Partial<ArticlePayload>) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('news_articles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/actualites');
  revalidatePath('/admin/actualites');
  return data;
}

export async function deleteArticle(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('news_articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/actualites');
  revalidatePath('/admin/actualites');
}

export async function toggleArticleStatus(id: string, current: 'draft' | 'published' | 'archived') {
  const next = current === 'published' ? 'draft' : 'published';
  return updateArticle(id, { status: next });
}

export async function listArticles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, slug, summary, category, tags, author, status, published_at, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
