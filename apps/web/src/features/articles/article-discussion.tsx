import Link from 'next/link';

import { CommentComposer } from './comment-composer';
import styles from './article-discussion.module.css';

/**
 * Both the article and its forum discovery URL render this SAME discussion.
 * All writes, reads, replies, reports and moderation keep the article ID and
 * existing Comment API; no separate Forum Post is ever created.
 */
export function ArticleDiscussion({
  apiUrl,
  articleId,
  articleSlug,
  initialCommentCount,
  inForum = false,
}: {
  apiUrl: string;
  articleId: string;
  articleSlug: string;
  initialCommentCount: number;
  inForum?: boolean;
}) {
  return (
    <section className={styles.discussion} id="diskussion">
      <header>
        <span className={styles.eyebrow}>Community</span>
        <h2>Diskussion</h2>
        <p>
          Alle Kommentare zu diesem Artikel stehen hier und im Forum in derselben Diskussion.
        </p>
        {inForum ? (
          <Link href={'/artikel/' + encodeURIComponent(articleSlug) + '#diskussion'}>
            Zum Artikel
          </Link>
        ) : (
          <Link href={'/forum/artikel/' + encodeURIComponent(articleSlug)}>
            Diese Diskussion im Forum öffnen
          </Link>
        )}
      </header>
      <CommentComposer
        key={apiUrl + ':' + articleId}
        apiUrl={apiUrl}
        articleId={articleId}
        initialCommentCount={initialCommentCount}
      />
    </section>
  );
}
