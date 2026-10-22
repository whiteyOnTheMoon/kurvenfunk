import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleDetail } from '../../../features/articles/article-detail';
import { env } from '../../../lib/env';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ArticleMetadataData {
  title: string;
  slug: string;
  lead: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImage: {
    id: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  leadMedia: {
    id: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
}

async function fetchArticle(slug: string) {
  const response = await fetch(
    `${env.API_URL}/api/v1/articles/by-slug/${encodeURIComponent(slug)}`,
    {
      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Artikel konnte nicht geladen werden.');
  }

  const payload = (await response.json()) as {
    data: (Parameters<typeof ArticleDetail>[0]['article'] & ArticleMetadataData) | null;
  };

  return payload.data;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {};
  }

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.lead || undefined;
  const canonical = article.canonicalUrl || `${env.WEB_URL}/artikel/${article.slug}`;
  const image = article.ogImage || article.leadMedia;

  const imageUrl = image
    ? `${env.API_URL}/api/v1/media/${encodeURIComponent(image.id)}/content`
    : undefined;

  const openGraphImages =
    image && imageUrl
      ? [
          {
            url: imageUrl,
            width: image.width ?? undefined,
            height: image.height ?? undefined,
            alt: image.altText ?? title,
          },
        ]
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: openGraphImages,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    notFound();
  }

  return <ArticleDetail article={article} apiUrl={env.API_URL} />;
}
