import { listArticles } from './actions';
import ArticlesManager from './ArticlesManager';

export const dynamic = 'force-dynamic';

export default async function AdminActualitesPage() {
  let articles: any[] = [];
  try {
    articles = await listArticles();
  } catch {
    // Table may not exist yet — will show empty state
  }

  return <ArticlesManager initialArticles={articles} />;
}
