import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleDiscussion } from '../../../../features/articles/article-discussion';
import {
  parseArticleDiscussionDetail,
  type ArticleDiscussionDetail,
} from '../../../../features/forum/article-discussion-feed';
import { env } from '../../../../lib/env';
import styles from '../../../../features/forum/article-discussion-directory.module.css';

export const metadata: Metadata = {
  title: 'Artikeldiskussionen | Kurvenfunk',
  // The article is the canonical editorial URL; do not create duplicate SEO pages.
  robots: { index: false, follow: true },
};

async function getPublishedDiscussion(slug: string): Promise<ArticleDiscussionDetail | null> {
  const response = await fetch(
    env.API_URL + '/api/v1/articles/by-slug/' + encodeURIComponent(slug),
    { cache: 'no-store' },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('ARTICLE_DISCUSSION_UNAVAILABLE');
  const detail = parseArticleDiscussionDetail(await response.json());
  // Never silently surface a different article if a stale route is requested.
  if (detail.slug !== slug) throw new Error('ARTICLE_DISCUSSION_SLUG_MISMATCH');
  return detail;
}

export default async function ForumArticleDiscussionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedDiscussion(slug);
  if (!article) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/forum/artikel" className={styles.backLink}>
          Alle Artikel-Diskussionen
        </Link>
        <p className={styles.eyebrow}>Community · Artikel</p>
        <h1>{article.title}</h1>
        {article.lead ? <p>{article.lead}</p> : null}
      </header>
      <ArticleDiscussion
        apiUrl={env.API_URL}
        articleId={article.id}
        articleSlug={article.slug}
        initialCommentCount={article._count.comments}
        inForum
      />
    </main>
  );
}
