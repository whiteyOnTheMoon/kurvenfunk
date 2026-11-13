'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ClubForumThreads } from './club-forum-threads';
import styles from './forum-overview.module.css';

interface ClubForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  threadCreationEnabled: boolean;
  club: { id: string; name: string; slug: string };
  category: { name: string; slug: string };
}

function isClubForum(value: unknown): value is ClubForum {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ClubForum>;
  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.slug === 'string' &&
    typeof row.club?.slug === 'string' &&
    typeof row.club?.name === 'string' &&
    typeof row.category?.slug === 'string'
  );
}

export function ClubForumPage({ apiUrl, clubSlug }: { apiUrl: string; clubSlug: string }) {
  const [forum, setForum] = useState<ClubForum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      setNotFound(false);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/forums/clubs/${encodeURIComponent(clubSlug)}`,
          { cache: 'no-store', signal: controller.signal },
        );
        if (response.status === 404) {
          if (!controller.signal.aborted) setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error('CLUB_FORUM_REQUEST_FAILED');
        const body: unknown = await response.json();
        const result = body as { data?: unknown };
        if (!isClubForum(result.data)) throw new Error('CLUB_FORUM_RESPONSE_INVALID');
        if (!controller.signal.aborted) setForum(result.data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [apiUrl, clubSlug]);

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <Link href="/forum" className={styles.backLink}>
          Alle Foren
        </Link>
        <p className={styles.eyebrow}>Vereinsforum</p>
        <h1>{forum?.club.name ?? 'Vereinsforum'}</h1>
        <p>
          {forum
            ? `Diskussionen und Community rund um ${forum.club.name}.`
            : 'Vereinsbezogene Fußball-Diskussionen.'}
        </p>
      </header>
      {loading ? (
        <p className={styles.status} role="status">
          Vereinsforum wird geladen …
        </p>
      ) : error ? (
        <p className={styles.status} role="alert">
          Das Vereinsforum ist derzeit nicht erreichbar.
        </p>
      ) : notFound || !forum ? (
        <p className={styles.status}>
          Für diesen Verein ist noch kein öffentliches Forum eingerichtet.
        </p>
      ) : (
        <section className={styles.category}>
          <div className={styles.categoryHeader}>
            <h2>{forum.name}</h2>
            <p>
              <Link href={`/forum/kategorie/${forum.category.slug}`}>
                Kategorie: {forum.category.name}
              </Link>
              {' · '}
              <Link href={`/vereine/${forum.club.slug}`}>Vereinsseite</Link>
            </p>
          </div>
          {!forum.threadCreationEnabled ? (
            <p className={styles.empty}>Dieses Forum ist derzeit nur lesbar.</p>
          ) : null}
          <ClubForumThreads apiUrl={apiUrl} forumSlug={forum.slug} />
        </section>
      )}
    </div>
  );
}
