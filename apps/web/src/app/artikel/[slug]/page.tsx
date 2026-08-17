import { notFound } from 'next/navigation';

import { ArticleDetail } from '../../../features/articles/article-detail';
import { env } from '../../../lib/env';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const response = await fetch(
    `${env.API_URL}/api/v1/articles/by-slug/${encodeURIComponent(slug)}`,
    {
      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error('Artikel konnte nicht geladen werden.');
  }

  const payload = (await response.json()) as {
    data: Parameters<typeof ArticleDetail>[0]['article'] | null;
  };

  if (!payload.data) {
    notFound();
  }

  return <ArticleDetail article={payload.data} />;
}
