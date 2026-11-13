'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from './forum-overview.module.css';
import { ThreadReplyComposer } from './thread-reply-composer';

interface PublicPost {
  id: string;
  sequenceNumber: number;
  content: string | null;
  deleted: boolean;
  createdAt: string;
  editedAt: string | null;
  author: { id: string; nickname: string | null } | null;
}

interface PublicThreadDetail {
  thread: {
    id: string;
    title: string;
    slug: string;
    status: 'OPEN' | 'LOCKED';
    postCount: number;
    forum: {
      name: string;
      slug: string;
      club: { name: string; slug: string } | null;
    };
  };
  posts: PublicPost[];
  hasMorePosts: boolean;
}

function isPublicThreadDetail(value: unknown): value is PublicThreadDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as Partial<PublicThreadDetail>;
  const thread = detail.thread;
  return (
    typeof thread?.id === 'string' &&
    typeof thread.title === 'string' &&
    typeof thread.slug === 'string' &&
    (thread.status === 'OPEN' || thread.status === 'LOCKED') &&
    typeof thread.forum?.slug === 'string' &&
    Array.isArray(detail.posts) &&
    detail.posts.every((post: unknown) => {
      if (!post || typeof post !== 'object') return false;
      const entry = post as Partial<PublicPost>;
      return (
        typeof entry.id === 'string' &&
        typeof entry.sequenceNumber === 'number' &&
        typeof entry.deleted === 'boolean' &&
        (entry.deleted
          ? entry.content === null && entry.author === null
          : typeof entry.content === 'string')
      );
    }) &&
    typeof detail.hasMorePosts === 'boolean'
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Datum unbekannt'
    : date.toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ClubThreadDetail({
  apiUrl,
  clubSlug,
  threadSlug,
}: {
  apiUrl: string;
  clubSlug: string;
  threadSlug: string;
}) {
  const [detail, setDetail] = useState<PublicThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [replyParent, setReplyParent] = useState<{
    id: string;
    sequenceNumber: number;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setDetail(null);
      setNotFound(false);
      setError(false);
      try {
        const forumSlug = 'verein-' + clubSlug;
        const response = await fetch(
          `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent(forumSlug)}/threads/${encodeURIComponent(threadSlug)}`,
          { cache: 'no-store', signal: controller.signal },
        );
        if (response.status === 404) {
          if (!controller.signal.aborted) setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error('THREAD_DETAIL_REQUEST_FAILED');
        const payload: unknown = await response.json();
        const result = payload as { data?: unknown };
        if (
          !isPublicThreadDetail(result.data) ||
          result.data.thread.slug !== threadSlug ||
          result.data.thread.forum.club?.slug !== clubSlug
        ) {
          throw new Error('THREAD_DETAIL_INVALID_RESPONSE');
        }
        if (!controller.signal.aborted) setDetail(result.data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [apiUrl, clubSlug, threadSlug, revision]);

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <Link href={`/forum/verein/${encodeURIComponent(clubSlug)}`} className={styles.backLink}>
          Zurück zum Vereinsforum
        </Link>
        <p className={styles.eyebrow}>Diskussion</p>
        <h1>{detail?.thread.title ?? 'Diskussionsthema'}</h1>
        {detail ? (
          <p>
            {detail.thread.forum.name}
            {detail.thread.status === 'LOCKED' ? ' · Geschlossen' : ''}
          </p>
        ) : (
          <p>Beiträge zur Diskussion im Vereinsforum.</p>
        )}
      </header>

      {loading ? (
        <p className={styles.status} role="status">
          Diskussion wird geladen …
        </p>
      ) : notFound ? (
        <p className={styles.status}>Dieses Diskussionsthema ist nicht verfügbar.</p>
      ) : error || !detail ? (
        <p className={styles.status} role="alert">
          Die Diskussion ist derzeit nicht erreichbar.
        </p>
      ) : (
        <section className={styles.threadDetail} aria-label="Beiträge">
          <h2>Beiträge</h2>
          {detail.posts.length === 0 ? (
            <p className={styles.empty}>In dieser Diskussion sind keine Beiträge sichtbar.</p>
          ) : (
            <ol className={styles.threadPostList}>
              {detail.posts.map((post) => (
                <li key={post.id} className={styles.threadPost}>
                  <div className={styles.threadPostHeader}>
                    <strong>
                      Beitrag #{post.sequenceNumber}
                      {post.deleted ? ' · Gelöscht' : ''}
                    </strong>
                    {!post.deleted ? (
                      <span>
                        {post.author?.nickname ?? 'Mitglied'}
                        {' · '}
                        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                      </span>
                    ) : null}
                  </div>
                  {post.deleted ? (
                    <p className={styles.threadPostDeleted}>Dieser Beitrag wurde entfernt.</p>
                  ) : (
                    <>
                      <p className={styles.threadPostBody}>{post.content}</p>
                      {detail.thread.status === 'OPEN' ? (
                        <button
                          type="button"
                          className={styles.threadInlineReply}
                          onClick={() =>
                            setReplyParent({ id: post.id, sequenceNumber: post.sequenceNumber })
                          }
                        >
                          Auf Beitrag #{post.sequenceNumber} antworten
                        </button>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
          {detail.hasMorePosts ? (
            <p className={styles.empty}>
              Weitere Beiträge sind vorhanden. Die vollständige Beitragsnavigation folgt. Neue
              Antworten können deshalb noch außerhalb der sichtbaren Liste liegen.
            </p>
          ) : null}
          {detail.thread.status === 'OPEN' ? (
            <ThreadReplyComposer
              apiUrl={apiUrl}
              forumSlug={detail.thread.forum.slug}
              threadSlug={detail.thread.slug}
              parentPostId={replyParent?.id}
              parentSequenceNumber={replyParent?.sequenceNumber}
              onCancelParent={() => setReplyParent(undefined)}
              onCreated={() => {
                setReplyParent(undefined);
                setRevision((value) => value + 1);
              }}
            />
          ) : (
            <p className={styles.empty}>Dieses Thema ist geschlossen. Antworten sind gesperrt.</p>
          )}
        </section>
      )}
    </main>
  );
}
