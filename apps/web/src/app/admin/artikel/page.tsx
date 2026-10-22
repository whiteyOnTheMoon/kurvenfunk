import { ArticleList } from '../../../features/admin/articles/article-list';
import { env } from '../../../lib/env';

export default function AdminArticlesPage() {
  return <ArticleList apiUrl={env.API_URL} />;
}
