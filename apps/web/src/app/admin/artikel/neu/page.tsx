import { ArticleEditor } from '../../../../features/admin/articles/article-editor';
import { env } from '../../../../lib/env';

export default function NewAdminArticlePage() {
  return <ArticleEditor apiUrl={env.API_URL} />;
}
