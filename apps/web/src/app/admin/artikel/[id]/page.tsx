import { ArticleEditor } from '../../../../features/admin/articles/article-editor';
import { env } from '../../../../lib/env';

export default async function EditAdminArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ArticleEditor apiUrl={env.API_URL} articleId={id} />;
}
