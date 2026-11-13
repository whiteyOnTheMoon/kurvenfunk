'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import styles from './forum-overview.module.css';
import { ThreadLockToggle } from './thread-lock-toggle';
import { ThreadMoveControl } from './thread-move-control';
import { ThreadMergeControl } from './thread-merge-control';
import { ThreadPinToggle } from './thread-pin-toggle';
import { ForumPostReportButton } from './forum-post-report-button';
import { ThreadReplyComposer } from './thread-reply-composer';
import { ThreadSubscriptionToggle } from './thread-subscription-toggle';
import { ThreadUnreadToggle } from './thread-unread-toggle';

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
    pinnedAt: string | null;
    forum: {
      name: string;
      slug: string;
      club: { name: string; slug: string } | null;
    };
  };
  posts: PublicPost[];
  hasMorePosts: boolean;
  nextPostCursor: string | null;
}

function isPublicThreadDetail(value: unknown): value is PublicThreadDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as Partial<PublicThreadDetail>;
  const thread = detail.thread;
  return (
    typeof thread?.id === 'string' &&
    typeof thread.title === 'string' &&
    typeof thread.slug === 'string' &&
    (thread.pinnedAt === null || typeof thread.pinnedAt === 'string') &&
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
    typeof detail.hasMorePosts === 'boolean' &&
    (detail.hasMorePosts
      ? typeof detail.nextPostCursor === 'string' && detail.nextPostCursor.length > 0
      : detail.nextPostCursor === null)
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
  const router = useRouter();
  const [detail, setDetail] = useState<PublicThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const moreRequest = useRef<AbortController | null>(null);
  const [revision, setRevision] = useState(0);
  const [replyParent, setReplyParent] = useState<{
    id: string;
    sequenceNumber: number;
  }>();

  const endpoint = `${apiUrl}/api/v1/forums/by-slug/${encodeURIComponent('verein-' + clubSlug)}/threads/${encodeURIComponent(threadSlug)}`;

  useEffect(() => {
    const controller = new AbortController();
    moreRequest.current?.abort();
    async function load() {
      setLoading(true);
      setDetail(null);
      setNotFound(false);
      setError(false);
      setMoreError(false);
      setLoadingMore(false);
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
        if (response.status === 404) {
          // A merged source exposes only a public canonical pointer. Hidden
          // archives and invisible targets still behave like ordinary 404s.
          const merged = await fetch(`${endpoint}/merge-target`, {
            cache: 'no-store',
            signal: controller.signal,
          });
          if (merged.ok) {
            const payload: unknown = await merged.json();
            const target = (
              payload as {
                data?: { threadSlug?: unknown; clubSlug?: unknown };
              }
            ).data;
            if (
              typeof target?.threadSlug === 'string' &&
              typeof target.clubSlug === 'string' &&
              !controller.signal.aborted
            ) {
              router.replace(
                `/forum/verein/${encodeURIComponent(target.clubSlug)}/thema/${encodeURIComponent(target.threadSlug)}`,
              );
              return;
            }
          }
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
    return () => {
      controller.abort();
      moreRequest.current?.abort();
    };
  }, [endpoint, clubSlug, threadSlug, revision, router]);

  async function loadMorePosts() {
    if (!detail?.nextPostCursor || loadingMore) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const response = await fetch(
        `${endpoint}?cursor=${encodeURIComponent(detail.nextPostCursor)}`,
        { cache: 'no-store', signal: controller.signal },
      );
      if (!response.ok) throw new Error('THREAD_POST_PAGE_FAILED');
      const payload: unknown = await response.json();
      const next = (payload as { data?: unknown }).data;
      if (
        !isPublicThreadDetail(next) ||
        next.thread.id !== detail.thread.id ||
        next.thread.slug !== threadSlug ||
        next.thread.forum.club?.slug !== clubSlug
      ) {
        throw new Error('THREAD_POST_PAGE_INVALID');
      }
      if (!controller.signal.aborted) {
        setDetail((previous) => {
          if (!previous || previous.thread.id !== next.thread.id) return previous;
          const ids = new Set(previous.posts.map((post) => post.id));
          return {
            ...next,
            posts: [...previous.posts, ...next.posts.filter((post) => !ids.has(post.id))],
          };
        });
      }
    } catch {
      if (!controller.signal.aborted) setMoreError(true);
    } finally {
      if (!controller.signal.aborted) {
        moreRequest.current = null;
        setLoadingMore(false);
      }
    }
  }

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
            {detail.thread.pinnedAt ? ' · Angepinnt' : ''}
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
          <ThreadMergeControl
            key={detail.thread.id + '-merge'}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
            threadId={detail.thread.id}
            clubSlug={clubSlug}
          />
          <ThreadMoveControl
            key={detail.thread.id + '-move'}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
          />
          <ThreadLockToggle
            key={detail.thread.id + '-lock'}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
            locked={detail.thread.status === 'LOCKED'}
            onChanged={() => {
              setReplyParent(undefined);
              setRevision((value) => value + 1);
            }}
          />
          <ThreadPinToggle
            key={detail.thread.id + '-pin'}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
            pinnedAt={detail.thread.pinnedAt}
            onChanged={() => setRevision((value) => value + 1)}
          />
          <ThreadSubscriptionToggle
            key={detail.thread.id}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
          />
          <ThreadUnreadToggle
            key={detail.thread.id + '-unread'}
            apiUrl={apiUrl}
            forumSlug={detail.thread.forum.slug}
            threadSlug={detail.thread.slug}
            revision={revision}
            posts={detail.posts.map((post) => ({
              id: post.id,
              sequenceNumber: post.sequenceNumber,
              deleted: post.deleted,
            }))}
          />
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
                      <ForumPostReportButton
                        apiUrl={apiUrl}
                        forumSlug={detail.thread.forum.slug}
                        threadSlug={detail.thread.slug}
                        postId={post.id}
                        authorId={post.author?.id ?? null}
                      />
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
          {detail.nextPostCursor ? (
            <div className={styles.paginationControls}>
              {moreError ? (
                <p role="alert">
                  Weitere Beiträge konnten nicht geladen werden. Bitte erneut versuchen.
                </p>
              ) : null}
              <button type="button" disabled={loadingMore} onClick={() => void loadMorePosts()}>
                {loadingMore ? 'Weitere Beiträge werden geladen …' : 'Weitere Beiträge laden'}
              </button>
            </div>
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
