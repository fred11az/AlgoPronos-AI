import { createAdminClient } from '@/lib/supabase/server';
import ArticlesManager from './ArticlesManager';

export const dynamic = 'force-dynamic';

export default async function AdminActualitesPage() {
  let articles: any[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('news_articles')
      .select('id, title, slug, summary, category, tags, author, status, published_at, created_at')
      .order('created_at', { ascending: false });
    articles = data ?? [];
  } catch {
    // Table may not exist yet — will show empty state
  }

  return <ArticlesManager initialArticles={articles} />;
}
